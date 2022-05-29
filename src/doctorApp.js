"use strict"
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import './App.css';
import drugs from './drugs.json';
import Autocomplete from 'react-autocomplete';
import 'font-awesome/css/font-awesome.min.css';
import doctor_pic from './images/doctor.png';
import Web3 from 'web3/dist/web3.min.js'
import {DrugModal} from './patientApp'

import 'bootstrap/dist/css/bootstrap.css';
import {Paginationbar} from 'reactstrap-paginationbar';


import {
    Button,
    Form,
    FormFeedback,
    FormGroup,
    Input,
    Label,
    Media,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Table
} from 'reactstrap';
import FontAwesome from "react-fontawesome";

let utils = require('./utils.js');
// var Web3 = require('web3');

const getMethods = (obj) => {
    let properties = new Set()
    let currentObj = obj
    do {
        Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
    } while ((currentObj = Object.getPrototypeOf(currentObj)))
    return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}


class PrescriptForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            formState: {"dosage-unit": "ml"},
            transactionTriggered: false,
            modalDrug: false,
        };
        this.toggleDrug = this.toggleDrug.bind(this);
    }

    async sendPrescription(e) {
        if (this.handleValidation()) {
            this.setState({
                transactionTriggered: true
            });
            this.props.state.ContractInstance.prescribe(
                this.state.formState["patient-address"],
                this.state.drug_code,
                this.state.medicationName,
                this.state.formState["dosage-quantity"],
                this.state.formState["dosage-unit"],
                0,
                Date.now(),
                Date.parse(this.state.formState["expiration-date"]),
                {gasPrice: 400000000, gasLimit: 400000})
                .then((tx) => {
                    this.props.state.transactionId = tx.hash;
                    this._reactInternalFiber._debugOwner.stateNode.getPrescriptions();
                })
                .catch((err) => {
                    alert("Транзакция была отменена. Повторите попытку.")
                })
                .finally(() => {
                    this.setState({
                        transactionTriggered: false
                    });
                })
        } else {
            e.preventDefault();
        }
    }

    toggleDrug() {
        this.setState({modalDrug: !this.state.modalDrug});
    }

    showDrug(pzn) {
        this.setState({pzn: pzn});
        this.toggleDrug()
    }


    handleValidation(){
        return (Web3.utils.isAddress(this.state.formState["patient-address"])) &&
            !(this.state.formState["expiration-date"] == null || this.state.formState["expiration-date"] === "");
    }

    inputUpdate(event) {
        this.setState({formState: {...this.state.formState, [event.target.name]: event.target.value}});
        return false;
    }

    checkAllFieldsValid = (formValues) => {
        let elements = Array.prototype.slice.call(formValues);
        return !elements.some(field => field.classList.contains('is-invalid'));
    };

    render() {
        if (this.props.input !== undefined && !this.props.input.drug_code) this.state.formState["patient-address"] = this.props.input.patientWalletAddress;
        if (this.props.input !== undefined && this.state.id !== this.props.input.id) {
            this.state.id = this.props.input.id;
            this.state.formState["patient-address"] = this.props.input.patientWalletAddress;
            this.state.drug_code = this.props.input.drug_code;
            this.state.medicationName = this.props.input.medicationName;
            this.state.formState["dosage-quantity"] = this.props.input.dosage;
            this.state.formState["dosage-unit"] = this.props.input.dosageUnit;
            if (this.props.input.expiryTime instanceof Date)
                this.state.formState["expiration-date"] = this.props.input.expiryTime.toISOString().substring(0, 10);
        }

        if (this.props.state.transactionId) {
            let html = (
                <Modal isOpen={this.props.visibility} toggle={this.props.toggle}>
                    <ModalHeader toggle={this.props.toggle}> Рецепт был отправлен!</ModalHeader>
                    <ModalBody>
                        <p>Рецепт был успешно отправлен на адрес: <code>{this.props.state.transactionId}</code></p>
                    </ModalBody>
                </Modal>);
            return html;
        } else {
            return (
                <Modal isOpen={this.props.visibility} toggle={this.props.toggle}>
                    <ModalHeader toggle={this.props.toggle}>Создать рецепт</ModalHeader>
                    <ModalBody>
                        <Form onInput={this.inputUpdate.bind(this)} tooltip="">
                            <FormGroup>
                                <Label for="exampleEmail">Адрес кошелька пациента</Label>
                                {/*<Input type="text" name="patient-address"*/}
                                {/*       value={this.state.formState["patient-address"] || ""} required valid/>*/}
                                <Input type="text" name="patient-address"  value={this.state.formState["patient-address"] || ""} placeholder="0x123f681646d4a755815f9cb19e1acc8565a0c2ac" required valid invalid={!Web3.utils.isAddress(this.state.formState["patient-address"])}/>
                                {/*<Input type="text" name="patient-address"  value={this.state.formState["patient-address"] || ""} placeholder="0x123f681646d4a755815f9cb19e1acc8565a0c2ac" required valid invalid={(this.state.formState["patient-address"] || "").toString().length < 33}/>*/}
                                <FormFeedback>Not a valid address </FormFeedback>
                            </FormGroup>
                            <FormGroup>
                                <Label for="exampleEmail">Код препарата</Label>
                                <Autocomplete
                                    getItemValue={(item) => item.label}
                                    items={drugs.map(function (drug) {
                                        return {
                                            label: drug['PZN'].toString() + " " + drug.Drug,
                                            value: drug['PZN'].toString() + '|' + drug.Drug,
                                        };
                                    })}
                                    shouldItemRender={(item, value) => true}
                                    getItemValue={item => item.value}
                                    wrapperStyle={{}}
                                    renderItem={(item, highlighted) =>
                                        <div
                                            key={item.id}
                                            style={{backgroundColor: highlighted ? '#eee' : 'transparent'}}
                                        >
                                            {item.label}
                                        </div>
                                    }
                                    type="text"
                                    name="drug_code"
                                    inputProps={{className: "form-control"}}
                                    required
                                    value={this.state.drug_code || ""}
                                    onChange={e => this.setState({
                                        drug_code: e.target.value.split('|')[0],
                                        medicationName: e.target.value.split('|')[1]
                                    })}
                                    onSelect={(val) => this.setState({
                                        drug_code: val.split('|')[0],
                                        medicationName: val.split('|')[1]
                                    })}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label for="exampleEmail">Название препарата</Label>
                                <Input type="text" name="medication-name" value={this.state.medicationName || ""}
                                       required/>
                            </FormGroup>
                            <FormGroup>
                                <Label for="exampleEmail">Доза</Label>
                                <Input type="number" name="dosage-quantity"
                                       value={this.state.formState["dosage-quantity"] || ""} required/>
                            </FormGroup>
                            <FormGroup>
                                <Label for="exampleEmail">Единица измерения дозы</Label>
                                <Input on type="select" name="dosage-unit"
                                       value={this.state.formState["dosage-unit"] || ""} required>
                                    <option value="ml">ml</option>
                                    <option value="mg">mg</option>
                                    <option value="tablets">tablets</option>
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label for="exampleEmail">Годен до</Label>
                                <Input type="date"
                                       min={(new Date((new Date()).getTime() + (7 * 60 * 60 * 24 * 1000))).toISOString().substr(0, 10)}
                                       name="expiration-date" placeholder=""
                                       value={this.state.formState["expiration-date"] || ""}
                                       invalid={this.state.formState["expiration-date"] == null || this.state.formState["expiration-date"] === ""}
                                       required/>
                                <FormFeedback>Not a valid date</FormFeedback>
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <div className="container mt-0">
                            <div className="row">
                                <Button className="col mr-1" color="secondary"
                                        onClick={this.props.toggle}>Отменить</Button>{' '}
                                <Button className="col" color="primary" onClick={this.sendPrescription.bind(this)}
                                        disabled={this.state.transactionTriggered}>Создать рецепт</Button>
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
}

PrescriptForm.contextTypes = {
    web3: PropTypes.object
};

class DoctorApp extends Component {
    constructor(props) {
        super(props);
        let pageSize = 5;
        this.state = {
            loaded: false,
            modal: false,
            accounts: [],
            transactionLogs: [],
            pageSize: pageSize,
            fromItem: 0,
            toItem: pageSize - 1
        };

        this.toggle = this.toggle.bind(this);
    }

    async componentDidMount() {
        let {accounts, instance} = await utils.setupContract();
        this.setState({
            ContractInstance: instance,
            accounts: accounts
        });
        if (this.state.ContractInstance) {
            await this.getPrescriptions();
            let doctor = await this.state.ContractInstance.approvedDoctors(this.state.accounts[0]);
            this.setState({
                user: doctor.name,
                loaded: true
            });
        }
    }

    async getPrescriptions(page) {
        let tokens = await this.state.ContractInstance.tokensIssued(this.state.accounts[0]);
        let transactionLogs = await Promise.all(tokens.reverse().map(this.getPrescription, this));
        let d = await this.getPrescription(1);
        this.setState({transactionLogs: transactionLogs})
    };

    async getPrescription(token) {
        let f = await this.state.ContractInstance.prescriptions(token);
        return {
            id: token,
            expiryTime: new Date(f.metadata.expirationTime.toNumber()),
            prescribedAt: new Date(f.metadata.dateFilled.toNumber()),
            patientWalletAddress: f.metadata.prescribedPatient,
            drug_code: f.metadata.drug_code,
            medicationName: f.metadata.medicationName,
            dosage: f.metadata.dosage,
            dosageUnit: f.metadata.dosageUnit,
            filled: f.filled
        };
    }

    async cancelPrescription(tx) {
        let f = await this.state.ContractInstance.cancelPrescription(tx.id.toNumber());
    }

    toggle() {
        this.setState({modal: !this.state.modal});
    }

    new() {
        if ((this.state.prior && this.state.prior.drug_code) || this.state.transactionId) {
            this.state.prior = {};
            this.state.transactionId = false;
        }
        this.toggle()
    }

    renew(tx) {
        this.state.prior = tx;
        this.toggle()
    }

    saveAddress(address) {
        if (!this.state.prior) this.state.prior = {};
        this.state.prior.patientWalletAddress = address;
    }

    renderTableRow(tx) {
        return (
            <tr key={tx.id}>
                <td>
                    <small data-toggle="tooltip" data-placement="top" title={tx.patientWalletAddress}>
                        {tx.patientWalletAddress}
                    </small>
                </td>
                <td>{
                    drugs.filter(f => f.PZN == tx.pzn).length > 0 &&
                    (<FontAwesome className="info-circle clickable" onClick={() => {
                        this.showDrug(tx.pzn)
                    }} name='info-circle' alt="User" style={{paddingRight: 5}}/>)
                }
                {tx.dosage} {tx.dosageUnit} of {tx.medicationName}</td>
                <td>{new Date(tx.expiryTime).toLocaleDateString("en-US")}</td>
                <td>{new Date(tx.prescribedAt).toLocaleDateString("en-US")}</td>
                <td>
                    <div className="row">
                        <Button style={{margin: 3}} color="primary" size="sm" onClick={() => {
                            this.renew(tx)
                        }}>Перевыпустить</Button>{' '}
                        {!tx.filled &&
                        <Button style={{margin: 3}} color="secondary" size="sm" onClick={() => {
                            this.cancelPrescription(tx)
                        }}>Отменить</Button>
                        }
                    </div>
                </td>
            </tr>
        )
    }

    render() {
        return (
            <div className="container">
                {
                    (this.state.accounts.length == 0) &&
                    <div className="container h-100" style={{fontSize: "x-large", marginTop: 80}}>
                        Не удалось обнаружить подключенный аккаунт. Подключите аккаунт вручную с помощью расширения Metamask и обновите страницу.
                    </div>
                }
                {
                    (this.state.loaded && this.state.user) &&
                    <div>
                        <div className="row position-relative">
                            <div className="row">
                                <Media object src={doctor_pic} style={{marginRight: 40}} height="150px"/>
                                <Media body>
                                    <h1>Здравствуйте, доктор {this.state.user}</h1>
                                    <h4>Адрес врача: <code>{this.state.accounts[0]}</code></h4>
                                </Media>
                            </div>
                            <div className="col-md-6 text-right position-absolute" style={{bottom: 0, right: 0}}>
                                <Button color="success" className="m-1" onClick={() => {
                                    this.new(this)
                                }}>Создать рецепт</Button>
                            </div>
                        </div>
                        <br/>
                        <Table>
                            <thead style={{backgroundColor: "rgba(162,212,223,0.55)", borderRadius: "50px"}}>
                            <tr>
                                <th width={"30%"}>Адрес пациента</th>
                                <th width={"30%"}>Описание рецепта</th>
                                <th width={"10%"}>Годен до</th>
                                <th width={"10%"}>Дата создания</th>
                                <th width={"30%"}> </th>
                            </tr>
                            </thead>
                            <tbody>
                            {this.state.transactionLogs
                                .slice(this.state.fromItem, this.state.toItem + 1)
                                .map(this.renderTableRow.bind(this))}
                            </tbody>
                        </Table>
                        <Paginationbar
                            totalItems={this.state.transactionLogs.length}
                            pageSize={this.state.pageSize}
                            onTurnPage={e => this.setState(e)}
                        />
                        <PrescriptForm visibility={this.state.modal} toggle={this.toggle} input={this.state.prior}
                                       state={this.state} onClosed={this.getPrescriptions}/>
                        <DrugModal visibility={this.state.modalDrug} toggle={this.toggleDrug} pzn={this.state.pzn}/>
                    </div>
                }
                {(this.state.loaded && !this.state.user) &&
                <h1>You do not have Doctor permissions on this account.</h1>
                }
            </div>
        );
    }
}

DoctorApp.contextTypes = {
    web3: PropTypes.object
};
export default DoctorApp;
