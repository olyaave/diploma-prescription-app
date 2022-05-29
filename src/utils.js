import ABI from "./ABI";
let ethers = require('ethers')
let contract = process.env.REACT_APP_CONTRACT_ADDRESS

export async function setupContract(){
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    if (window.ethereum) {
        try {
            // Request account access if needed
            await window.ethereum.enable();
            let accounts = await provider.listAccounts();
            console.log("accounts: " + accounts)
            let signer = provider.getSigner();
            let instance = new ethers.Contract(contract, ABI, signer);
            return {accounts: accounts, instance: instance};
            // return {"accounts": accounts, "instance": instance};
        } catch (error) {
        }
    }
}
