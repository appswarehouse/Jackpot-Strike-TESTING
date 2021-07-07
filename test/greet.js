const { iteratee } = require('lodash');
const assertion = require('truffle-assertions');
const Prediction = artifacts.require("Prediction");
const PRE = artifacts.require("PRE");

//run each test seperately to avoid timeout, in case of timeout you may increase mocha timeout in truffle-config
contract('Greeter', async function(accounts){

    // from accounts to choose the sender
    function a(num){return {from:accounts[num]};}
    const n = function(num){return num.toString()}
    const min = function(n,m){return n-m}
    const ether = web3.utils.toWei('1','ether');
    let initial_balances = [], final_balances = [];
    let token,contract;
    let initial = 0;
    let s, cycle, ADDRESS;
    let positions = [0,10,26,36,20,12,33.5,15.2,42.2];
    let totalLong = 92,totalShort = 102.9;
    
    beforeEach('Before each',async()=>{
        token = await PRE.at("0x4f699f366272f17297b69061fc16a86f2657c5c4");
        contract = await Prediction.deployed();
        ADDRESS = contract.address;
        console.log("PREDICTION: ",ADDRESS);
        cycle = await contract.getLatestCycle(initial);
        initial_balances = [];
        final_balances = [];
        for(i of accounts){
            let bn = await token.balanceOf(i);
            // console.log("obs",n(bn));
            initial_balances.push(n(bn));
        }
    });
    it('should reverts opposite position',async()=>{
        let i = 1;
        let amount;
        let position = (10*ether).toString();
        await token.approve(ADDRESS,position,a(i));
        amount = n(await token.allowance(accounts[i],ADDRESS));
        assert.equal(amount,BigInt(position.toString()));
        await contract.bid(initial,position,true,a(i));   

        await token.approve(ADDRESS,position,a(i));
        await assertion.reverts(contract.bid(initial,position,false,a(i)))
    })
    // it('should be when tie', async()=>{
    //     for([i,v] of positions.entries()){
    //         let amount;
    //         let position = (v*ether).toString();
    //         if(i>=1 && i<=4){
    //             await token.approve(ADDRESS,position,a(i));
    //             amount = n(await token.allowance(accounts[i],ADDRESS));
    //             assert.equal(amount,BigInt(position.toString()));
    //             await contract.bid(initial,position,true,a(i));   
    //         }else if(i>=5 && i<=8){
    //             await token.approve(ADDRESS,position,a(i));
    //             amount = n(await token.allowance(accounts[i],ADDRESS));
    //             assert.equal(amount,BigInt(position.toString()));
    //             await contract.bid(initial,position,false,a(i));
    //         }
    //     }
    //     s = 1;
    //     // even non-participants
    //     for([i,v] of accounts.entries()){
    //         if(i>=1 && i<=8) await contract.withdraw(initial,cycle,s,a(i));
    //     }
    //     for(i of accounts){
    //         let bn = await token.balanceOf(i);
    //         // console.log("obs",n(bn));
    //         final_balances.push(n(bn));
    //     }
    //     for([i,v] of accounts.entries()){
    //         if(final_balances[i] == undefined || !(i>=1 && i<=8)) continue;
    //         let _i = initial_balances[i];
    //         let _f = final_balances[i];
    //         let _afterMath = min(_f,_i)/ether;
    //         let fx6 = function(num){return num.toFixed(6)}
    //         let actual = fx6(_afterMath);
    //         let expected = 0;
    //         assert.equal(actual,expected,"Tie is not working");
    //     }
    // });

    // it('should be when long', async()=>{
    //     for([i,v] of positions.entries()){
    //         let amount;
    //         let position = (v*ether).toString();
    //         if(i>=1 && i<=4){
    //             await token.approve(ADDRESS,position,a(i));
    //             amount = n(await token.allowance(accounts[i],ADDRESS));
    //             assert.strictEqual(amount,position);
    //             await contract.bid(initial,position,true,a(i));   
    //         }else if(i>=5 && i<=8){
    //             await token.approve(ADDRESS,position,a(i));
    //             amount = n(await token.allowance(accounts[i],ADDRESS));
    //             assert.strictEqual(amount,position);
    //             await contract.bid(initial,position,false,a(i));
    //         }

    //     }

    //     s = 2;
    //     // even non-participants
        
    //     for([i,v] of accounts.entries()){
    //         if(i>=1 && i<=4){
    //             await assertion.passes(contract.withdraw(initial,cycle,s,a(i)));
    //             // checks for double withdraw
    //             await assertion.reverts(contract.withdraw(initial,cycle,s,a(i)));
    //         }else if(i>=5 && i<=8){
    //             // checks for liquidated poaitions
    //             await assertion.reverts(contract.withdraw(initial,cycle,s,a(i)));
    //         }
    //     }

    //     for(i of accounts){
    //         let bn = await token.balanceOf(i);
    //         // console.log("obs",n(bn));
    //         final_balances.push(n(bn));
    //     }

    //     // checking
    //     console.log("i /l=long s=short/ diff / total pnl %")
    //     for([i,v] of accounts.entries()){
    //         if(final_balances[i] == undefined || !(i>=1 && i<=8)) continue;
    //         let position = positions[i];
    //         let _i = initial_balances[i];
    //         let _f = final_balances[i];
    //         let _afterMath = min(_f,_i)/ether;
    //         let fx6 = function(num){return num.toFixed(6)}
    //         if(_afterMath >= 0){
    //             console.log(i," /l ",fx6(_afterMath), " / ", (fx6(_afterMath/totalShort)*100).toString()," %");
    //         }else{
    //             console.log(i," /s ",fx6(_afterMath), "/ ", (fx6(_afterMath/position)*100).toString()," %");
    //         }
    //         if(i>=1 && i<=4){ //Longs
    //             let actual = fx6(_afterMath);
    //             let expected = fx6((position/totalLong)*totalShort);
    //             assert.equal(actual,expected,"Long is not expected");
    //         }else if(i>=5 && i<=8){ //Shorts
    //             assert.equal(_afterMath.toFixed(1),-position, "Short is not expected");
    //         }
    //     }
    // });

    // it('should be when short', async()=>{
    //     for([i,v] of positions.entries()){
    //         let amount;
    //         let position = (v*ether).toString();
    //         if(i>=1 && i<=4){
    //             await token.approve(ADDRESS,position,a(i));
    //             amount = n(await token.allowance(accounts[i],ADDRESS));
    //             assert.strictEqual(amount,position);
    //             await contract.bid(initial,position,true,a(i));   
    //         }else if(i>=5 && i<=8){
    //             await token.approve(ADDRESS,position,a(i));
    //             amount = n(await token.allowance(accounts[i],ADDRESS));
    //             assert.strictEqual(amount,position);
    //             await contract.bid(initial,position,false,a(i));
    //         }

    //     }

    //     s = 3;
    //     // even non-participants
        
    //     for([i,v] of accounts.entries()){
    //         if(i>=1 && i<=4){
    //             await assertion.reverts(contract.withdraw(initial,cycle,s,a(i)));
    //         }else if(i>=5 && i<=8){
    //             await assertion.passes(contract.withdraw(initial,cycle,s,a(i)));
    //             // checks for double withdraw
    //             await assertion.reverts(contract.withdraw(initial,cycle,s,a(i)));
    //         }
    //     }

    //     for(i of accounts){
    //         let bn = await token.balanceOf(i);
    //         // console.log("obs",n(bn));
    //         final_balances.push(n(bn));
    //     }

    //     // checking
    //     console.log("i /l=long s=short/ diff / total pnl %")
    //     for([i,v] of accounts.entries()){
    //         if(final_balances[i] == undefined || !(i>=1 && i<=8)) continue;
    //         let position = positions[i];
    //         let _i = initial_balances[i];
    //         let _f = final_balances[i];
    //         let _afterMath = min(_f,_i)/ether;
    //         let fx6 = function(num){return num.toFixed(6)}

    //         if(_afterMath < 0){
    //             console.log(i," /l ",fx6(_afterMath), " / ", (fx6(_afterMath/position)*100).toString()," %");
    //         }else{
    //             console.log(i," /s ",fx6(_afterMath), "/ ", (fx6(_afterMath/totalLong)*100).toString()," %");
    //         }

    //         if(i>=1 && i<=4){ //Longs
    //             assert.equal(_afterMath.toFixed(1),-position, "Long is not expected");
    //         }else if(i>=5 && i<=8){ //Shorts
    //             let actual = fx6(_afterMath);
    //             let expected = fx6((position/totalShort)*totalLong);
    //             assert.equal(actual,expected,"Short is not expected");
    //         }
    //     }
    // });
    // it('should be when long - empty short', async()=>{
    //     for([i,v] of positions.entries()){
    //         let amount;
    //         let position = (v*ether).toString();
    //         if(i>=1 && i<=4){
    //             await token.approve(ADDRESS,position,a(i));
    //             amount = n(await token.allowance(accounts[i],ADDRESS));
    //             assert.strictEqual(amount,position);
    //             await contract.bid(initial,position,true,a(i));   
    //         }
    //     }
    //     s = 2;
    //     // even non-participants
    //     for([i,v] of accounts.entries()){
    //         if(i>=1 && i<=4){
    //             await assertion.passes(contract.withdraw(initial,cycle,s,a(i)));
    //             // checks for double withdraw
    //             await assertion.reverts(contract.withdraw(initial,cycle,s,a(i)));
    //         }else if(i>=5 && i<=8){
    //             // invalid particpants
    //             await assertion.reverts(contract.withdraw(initial,cycle,s,a(i)));
    //         }
    //     }
    //     for(i of accounts){
    //         let bn = await token.balanceOf(i);
    //         // console.log("obs",n(bn));
    //         final_balances.push(n(bn));
    //     }
    //     // checking
    //     console.log("i /l=long s=short/ diff")
    //     for([i,v] of accounts.entries()){
    //         if(final_balances[i] == undefined || !(i>=1 && i<=8)) continue;
    //         let _i = initial_balances[i];
    //         let _f = final_balances[i];
    //         let _afterMath = min(_f,_i)/ether;
    //         let fx6 = function(num){return num.toFixed(6)}
    //         if(i>=1 && i<=4){ //Longs
    //             console.log(i," /l ",fx6(_afterMath));
    //             let actual = fx6(_afterMath);
    //             let expected = 0;
    //             assert.equal(actual,expected,"Long is not expected");
    //         }
    //     }
    // });


    // it('should be when short - empty long', async()=>{
    //     for([i,v] of positions.entries()){
    //         let amount;
    //         let position = (v*ether).toString();
    //         if(i>=5 && i<=8){
    //             await token.approve(ADDRESS,position,a(i));
    //             amount = n(await token.allowance(accounts[i],ADDRESS));
    //             assert.strictEqual(amount,position);
    //             await contract.bid(initial,position,false,a(i));   
    //         }
    //     }
    //     s = 3;
    //     // even non-participants
    //     for([i,v] of accounts.entries()){
    //         if(i>=1 && i<=4){
    //             // invalid particpants
    //             await assertion.reverts(contract.withdraw(initial,cycle,s,a(i)));
    //         }else if(i>=5 && i<=8){
    //             await assertion.passes(contract.withdraw(initial,cycle,s,a(i)));
    //             // checks for double withdraw
    //             await assertion.reverts(contract.withdraw(initial,cycle,s,a(i)));
    //         }
    //     }
    //     for(i of accounts){
    //         let bn = await token.balanceOf(i);
    //         // console.log("obs",n(bn));
    //         final_balances.push(n(bn));
    //     }
    //     // checking
    //     console.log("i /l=long s=short/ diff")
    //     for([i,v] of accounts.entries()){
    //         if(final_balances[i] == undefined || !(i>=1 && i<=8)) continue;
    //         let _i = initial_balances[i];
    //         let _f = final_balances[i];
    //         let _afterMath = min(_f,_i)/ether;
    //         let fx6 = function(num){return num.toFixed(6)}
    //         if(i>=5 && i<=8){ //Shorts
    //             console.log(i," /l ",fx6(_afterMath));
    //             let actual = fx6(_afterMath);
    //             let expected = 0;
    //             assert.equal(actual,expected,"Long is not expected");
    //         }
    //     }
    // });

});
