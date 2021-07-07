// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./ERC20.sol";
import "./_utils/SafeMath.sol";
import "./PredictionCore.sol";
import "./interfaces/AggregatorV2V3Interface.sol";
import "./Ownable.sol";

contract Prediction is Ownable,PredictionCore{
    using SafeMath for uint;
    using SafeMath80 for uint80;
    // Kovan : 0xDE99C79533EEB1897d1d12dF3E5437D498ba82a6
    // Rinkeby : 0x4F699F366272F17297b69061FC16a86F2657C5C4
    IERC20 private XDAI = IERC20(0x4F699F366272F17297b69061FC16a86F2657C5C4);
    event _bid(
        bool indexed bidType,
        address indexed bidder,
        uint amount
        );
    function addToken(
        address token,
        uint80 _startingRound)
        public onlyOwner
        {
        markets[marketCount].feed = AggregatorV2V3Interface(token);
        markets[marketCount].startingRound = _startingRound;
        marketCount++;
    }
    function addArrayToken(
        address[] calldata token,
        uint80[] calldata _startingRound)
        public onlyOwner
        {
        require(token.length != 0, "array is empty");
        require(_startingRound.length != 0, "array is empty");
        require(token.length == _startingRound.length, "unequal array size");
        for(uint i = 0; i<token.length;i++ ) addToken(token[i],_startingRound[i]);
    }
    constructor(){
        addToken(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e,36893488147419104000);
        addToken(0xECe365B379E1dD183B20fc5f022230C044d51404,36893488147419103300);
        addToken(0x031dB56e01f82f20803059331DC6bEe9b17F7fC9,36893488147419103300);
        addToken(0x4d38a35C2D87976F334c2d2379b535F1D461D9B4,36893488147419103300);
        addToken(0xd8bD0a1cB028a31AA859A21A3758685a95dE4623,36893488147419103300);

    }
    function _deposit(uint amount) internal{
        //convert to 18 decimals format
        require(XDAI.balanceOf(_msgSender())>=amount,"insufficient balance");
        require(XDAI.allowance(_msgSender(),address(this)) >= amount,"unapproved transaction");
        XDAI.transferFrom(_msgSender(),address(this),amount);
    }
    function _withdraw(
        uint _i,
        uint80 _cycle,
        uint amount) internal
        {
        markets[_i].pools[_cycle].isWithdrawn[msg.sender] = true;
        XDAI.transfer(msg.sender,amount);
    }
    // we used 10**18 as a % to retrieve an accurate participant portion from total position
    // when returned the value need to be divided by 10**18
    function _reward(
        uint _i,
        uint80 _cycle,
        bool _type)
        internal view returns(uint reward)
        {
        uint totalStake;
        uint totalOpStake;
        uint ratio;
        uint stake;
        if(_type){
            totalStake = getTotalLongs(_i,_cycle);
            stake = getLong(_i,_cycle);
            ratio = (stake.mul(10**18)).div(totalStake);
            totalOpStake = getTotalShorts(_i,_cycle);
            reward = (totalOpStake.mul(ratio)).div(10**18);
        }else{
            totalStake = getTotalShorts(_i,_cycle);
            stake = getShort(_i,_cycle);
            ratio = (stake.mul(10**18)).div(totalStake);
            totalOpStake = getTotalLongs(_i,_cycle);
            reward = (totalOpStake.mul(ratio)).div(10**18);
        }
    }
    // bid - true: Long, false: short
    function bid(
        uint _i,
        uint amount,
        bool position)
        public validFeed(_i)
        {
        (uint H, uint L) = getPriceBoundries(_i,getLatestCycle(_i));
        H = H.sub((H.mul(LOCKED_PERCENTAGE)).div(100));
        L = L.add((L.mul(LOCKED_PERCENTAGE)).div(100));
        // uint latestPrice = getLatestPrice(_i);
        uint80 cycle = getLatestCycle(_i);
        require(amount >= MINIMUM_BID, "bidding amount is less than 10$");
        require(getPriceStatus(_i,cycle) == Status.PENDING,"round has been determined");
        // require(latestPrice<=H && latestPrice>=L,"Price locked range");
        if(position){
            require(getShort(_i,cycle) == 0, "Short position is in place");
            _deposit(amount);
            markets[_i].pools[cycle].Longs[msg.sender] += amount;
            markets[_i].pools[cycle].totalLongs += amount;
            markets[_i].activeCycle[msg.sender].push(cycle);
            emit _bid(position, msg.sender, amount);
        }else{
            require(getLong(_i,cycle) == 0, "Long position is in place");
            _deposit(amount);
            markets[_i].pools[cycle].Shorts[msg.sender] += amount;
            markets[_i].pools[cycle].totalShorts += amount;
            markets[_i].activeCycle[msg.sender].push(cycle);
            emit _bid(position, msg.sender, amount);
        }
    }
    function withdraw(uint _i, uint80 _cycle, uint statu) public validFeed(_i) validCycle(_i,_cycle) {
        uint long = getLong(_i,_cycle);
        uint short = getShort(_i,_cycle);
        // Status status = checkPriceReach(_i,_cycle);
        Status status = Status(statu);
        // require(status != Status.PENDING, "Cycle in Progress");
        require(long != 0 || short != 0, "Invalid participant");
        // require(_cycle < geLatestCycle(_i),"withdraw is inactive, wait until the cycle is over"); // might be deleted
        require(markets[_i].pools[_cycle].isWithdrawn[msg.sender] == false, "funds have been withdrawn");
        uint position;
        uint finalReward;
        Status state;
        if(long>0){position = long;}
        else if(short>0){position = short;}
        if(status != Status.TIE){
            if(long>0){state = Status.LONG;}
            else if(short>0){state = Status.SHORT;}
            require(status == state,"you have been liquidated");
        }
        if(status == Status.TIE){
            _withdraw(_i,_cycle,position);
        }else if(status == Status.LONG){
            finalReward = position.add(_reward(_i,_cycle,true));
            _withdraw(_i,_cycle,finalReward);
        }else if(status == Status.SHORT){
            finalReward = position.add(_reward(_i,_cycle,false));
            _withdraw(_i,_cycle,finalReward);
        }
    }
    // debugging
    function getPositionInfo(
        uint _i,
        uint80 _cycle)
        public validCycle(_i,_cycle) view returns(string memory,uint)
        {
        uint long = markets[_i].pools[_cycle].Longs[msg.sender];
        uint short = markets[_i].pools[_cycle].Shorts[msg.sender];
        string memory message;
        uint size;
        if(long > 0){
            message = "LONG";
            size = long;
        }else if(short > 0){
            message = "SHORT";
            size = short;
        }else{
            message = "NONE";
        }
        return (message,size);
    }
}



