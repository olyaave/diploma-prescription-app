'use strict';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import QRModal from './QRModal';
import 'bootstrap/dist/css/bootstrap.css';
import './App.css';
import drugs from './drugs.json';
import 'font-awesome/css/font-awesome.min.css';
import {
    Media, Table, Button,
    Modal, ModalHeader,
    ModalBody, ModalFooter, Form, FormGroup,
    Label, Input
} from 'reactstrap';

let QRCode = require('qrcode.react');
let FontAwesome = require('react-fontawesome');

let utils = require('./utils.js');

class ModalForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            formState: {},
            transactionTriggered: false
        };
    }

    async fill() {
        this.setState({
            transactionTriggered: true
        });

        this.props.state.ContractInstance.fillPrescription(
            this.state.formState["pharmacy-address"],
            this.props.state.tokenId
        ).then((tx) => {
            this._reactInternalFiber._debugOwner.stateNode.updatePrescription(this.props.state.tokenId);
            this.props.toggle();
        })
            .catch((err) => {
            })
            .finally(() => {
                this.setState({
                    transactionTriggered: false
                });
            })
    }

    inputUpdate(event) {
        this.setState({formState: {...this.state.formState, [event.target.name]: event.target.value}});
        return false;
    }

    render() {
        if (this.props.state.address) this.state.formState["pharmacy-address"] = this.props.state.address;
        return (
            <Modal isOpen={this.props.visibility} toggle={this.props.toggle}>
                <ModalHeader toggle={this.props.toggle}>Использовать рецепт</ModalHeader>
                <ModalBody>
                    <Form>
                        <FormGroup>
                            <Label for="exampleEmail">Адрес кошелька аптеки:</Label>
                            <Input type="text" name="pharmacy-address" onChange={this.inputUpdate.bind(this)}
                                   value={this.state.formState["pharmacy-address"] || ""}
                                   placeholder="0x123f681646d4a755815f9cb19e1acc8565a0c2ac"/>
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <div className="container mt-0">
                        <div className="row">
                            <Button className="col mr-1" color="secondary"
                                    onClick={this.props.toggle}>Отменить</Button>{' '}
                            <Button className="col" color="primary" onClick={this.fill.bind(this)}
                                    disabled={this.state.transactionTriggered}>Отправить рецепт</Button>
                        </div>
                        {this.state.transactionTriggered &&
                        <div className="row mt-2"><p className="mb-0">Транзакция была вызвана. Пожалуйста, подтвердите ее в MetaMask.</p></div>
                        }
                    </div>
                </ModalFooter>
            </Modal>
        );
    }
}

class QRAddressModal extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Modal isOpen={this.props.visibility} toggle={this.props.toggle}>
                <ModalHeader toggle={this.props.toggle}>Your Account Address</ModalHeader>
                <ModalBody>
                    <code>{this.props.account}</code><br/>< br/>
                    <QRCode size="512" value={this.props.account} style={{width: "100%"}}/>
                </ModalBody>
            </Modal>
        )
    }
}

export class DrugModal extends Component {
    constructor(props) {
        super(props);

    }

    initDrug() {
        let drug = drugs.filter(f => f.PZN == this.props.pzn);
        if (drug.length > 0) {
            drug = drug[0];
        }
        this.state = {
            drug: drug
        };
    }

    render() {
        this.initDrug();
        return (
            <Modal isOpen={this.props.visibility} toggle={this.props.toggle}>
                <ModalHeader toggle={this.props.toggle}>Информация о рецепте</ModalHeader>
                <ModalBody>
                    <p><strong>Препарат</strong><br/>
                        {this.state.drug['Drug']}</p>
                    <p><strong>Анатомо-терапевтическо-химическая классификация (АТХ)</strong><br/>
                        {this.state.drug['ATX']}</p>
                    <p><strong>Код АТХ</strong><br/>
                        {this.state.drug['CodeATX']}</p>
                    <p><strong>Изготовитель</strong><br/>
                        {this.state.drug['Company']}</p>
                    <p><strong>Показания к применению</strong><br/>
                        {this.state.drug['Indications for use']}</p>
                    <p><strong>Противопоказания</strong><br/>
                        {this.state.drug['Contraindication']}</p>
                    <p><strong>Дозировка</strong><br/>
                        {this.state.drug['Dosage']} EUR</p>
                    <p><strong>Код препарата</strong><br/>
                        {this.state.drug['PZN']}</p>
                    <p><strong>Побочные действия</strong><br/>
                        {this.state.drug['Side effects']}</p>
                </ModalBody>
            </Modal>
        )
    }
}

ModalForm.contextTypes = {
    web3: PropTypes.object
};

class PatientApp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            modal: false,
            transactionLogs: [],
            accounts: [],
            loading: true,
        };

        this.toggle = this.toggle.bind(this);
        this.toggleQR = this.toggleQR.bind(this);
        this.toggleQRAddress = this.toggleQRAddress.bind(this);
        this.toggleDrug = this.toggleDrug.bind(this);
    }

    async componentDidMount() {

        let {accounts, instance} = await utils.setupContract();
        // let {instance} = await utils.setupContract();
        // let accounts = await window.ethereum.request({ method: 'eth_accounts' });
        // console.log("account: " + account);
        console.log("accounts: " + accounts);

        this.setState({
            ContractInstance: instance,
            accounts: accounts
        });
        await this.getFunding();
        await this.getPrescriptions();
    }

    async getFunding() {
        // let account = window.web3.eth.accounts[0];
        let accounts = await window.ethereum.request({method: 'eth_accounts'});
        const account = accounts[0]
        console.log("account: " + account)
        console.log("account: " + typeof (account))
        window.ethereum.request({
            method: 'eth_getBalance',
            params: [
                account,
                'latest'
            ],
        }, (err, balance) => {
            // window.web3.eth.getBalance(account, (err, balance) => {
            console.log("balance: " + balance)
            if (balance.toNumber() === 0) {
                var xhr = new XMLHttpRequest()
                xhr.open('GET', "http://" + window.location.hostname + ":3333/" + account)
                xhr.send()
            }
            balance = window.web3.fromWei(balance, "ether") + " ETH";
        });
    }

    async getPrescriptions(page) {
        console.log("this.state.accounts[0]: " + this.state.accounts[0])
        await window.ethereum.enable();
        let tokens = await this.state.ContractInstance.tokensOf(this.state.accounts[0]);
        let transactionLogs = await Promise.all(tokens.reverse().map(this.getPrescription, this));
        this.setState({transactionLogs: transactionLogs, loading: false})
    };

    async getPrescription(token) {
        let f = await this.state.ContractInstance.prescriptions(token);
        return {
            id: token.toNumber(),
            expiryTime: new Date(f.metadata.expirationTime.toNumber()),
            prescribedAt: new Date(f.metadata.dateFilled.toNumber()),
            patientWalletAddress: f.metadata.prescribedPatient,
            medicationName: f.metadata.medicationName,
            dosage: f.metadata.dosage,
            dosageUnit: f.metadata.dosageUnit,
            filled: f.filled,
            pzn: f.metadata.pzn
        };
    }

    toggle() {
        this.setState({modal: !this.state.modal});
    }

    toggleQR() {
        this.setState({modalQR: !this.state.modalQR});
    }

    toggleQRAddress() {
        this.setState({modalQRAddress: !this.state.modalQRAddress});
    }

    showDrug(pzn) {
        console.log("showDrug")
        this.setState({pzn: pzn});
        this.toggleDrug()
    }

    toggleDrug() {
        this.setState({modalDrug: !this.state.modalDrug});
    }

    saveAddress(address) {
        this.state.address = address;
    }

    fill(tx) {
        this.setState({tokenId: tx.id})
        this.toggle()
    }

    updatePrescription(id) {
        let i = this.state.transactionLogs.findIndex(tx => tx.id === id);
        this.state.transactionLogs[i].filled = true;
        this.forceUpdate();
    }

    renderTableRow(tx) {
        return (
            <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{
                    drugs.filter(f => f.PZN == tx.pzn).length > 0 &&
                    (<FontAwesome className="info-circle clickable" onClick={() => {
                        console.log('click')
                        this.showDrug(tx.pzn)
                    }} name='info-circle' alt="User" style={{paddingRight: 5}}/>)
                }
                    {tx.dosage} {tx.dosageUnit} {tx.medicationName}</td>
                <td>{new Date(tx.expiryTime).toLocaleDateString("en-US")}</td>
                <td>{new Date(tx.prescribedAt).toLocaleDateString("en-US")}</td>
                <td>
                    {tx.filled ?
                        <Button color="default" size="sm" disabled>Рецепт использован.</Button> :
                        <Button color="success" size="sm" className="btn-block" onClick={() => {
                            this.fill(tx)
                        }}>Использовать</Button>
                    }
                </td>
            </tr>
        )
    }

    render() {
        return (
            <div className="container">
                {
                    (this.state.accounts.length === 0) &&
                    <div className="container h-100" style={{fontSize: "x-large", marginTop: 80}}>
                        Не удалось обнаружить подключенный аккаунт. Подключите аккаунт вручную с помощью расширения Metamask и обновите страницу.
                    </div>
                }
                {
                    (this.state.accounts.length > 0) &&
                    <div>
                    <div className="row  position-relative">
                        <div className="col-md-8">
                            <Media>
                                <FontAwesome className="user-icon clickable" onClick={() => {
                                    this.toggleQRAddress()
                                }} name='user-circle' alt="User" size={"5x"}/>
                                <Media body>
                                    <h1>Здравствуйте, пациент!</h1>
                                    {this.state.accounts[0] !== undefined &&
                                    <p>Нажмите на изображение профиля для показа QR-кода адреса пациента. <br/></p>
                                    }
                                    {this.state.transactionLogs.length !== 0 &&
                                    <h4>Список полученных рецептов:</h4>
                                    }
                                    {(!this.state.transactionLogs.length && !this.state.loading) &&
                                    <h4>Нет неиспользованных рецептов.</h4>
                                    }

                                </Media>
                            </Media>
                        </div>
                        {/*<div className="col-md-4 text-right position-absolute" style={{bottom: 0, right: 0}}>*/}
                        {/*    <Button color="secondary" className="m-1" onClick={() => {*/}
                        {/*        this.toggleQR()*/}
                        {/*    }}><FontAwesome name='camera' className="mr-2"/> Scan pharmacy address</Button>*/}
                        {/*</div>*/}
                    </div>
                    <br />
                    <Table>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Описание рецепта</th>
                        <th>Годен до</th>
                        <th>Дата создания</th>
                        <th> </th>
                    </tr>
                    </thead>
                    <tbody>
                {this.state.transactionLogs.map(this.renderTableRow.bind(this))}
                    </tbody>
                    </Table>

                    <ModalForm visibility={this.state.modal} toggle={this.toggle} state={this.state}/>
                    <QRAddressModal visibility={this.state.modalQRAddress} toggle={this.toggleQRAddress} account={this.state.accounts[0]}/>
                    <QRModal visibility={this.state.modalQR} toggle={this.toggleQR} state={this.state} onScan={this.saveAddress}/>
                    <DrugModal visibility={this.state.modalDrug} toggle={this.toggleDrug} pzn={this.state.pzn}/>
                    </div>
                }
            </div>
        );
    }
}

PatientApp.contextTypes = {
    web3: PropTypes.object
};
export default PatientApp;
