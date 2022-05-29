import React, {Component} from 'react';
import {BrowserRouter} from 'react-router-dom'
import {Route, Router, Routes, Link} from 'react-router-dom'


class MainApp extends Component {

    handleDoctorClick() {
        window.location.href = "/doctor-interface"
    }

    handlePatientClick() {
        window.location.href = "/patient-interface"
    }

    handlePharmacyClick() {
        window.location.href = "/pharmacy-interface"
    }

    render() {
        return (
            (
                <div className=" overflow-hidden h-100 align-content-center" style={{minHeight: "100vh"}}>
                    <nav className="navbar navbar-expand-lg navbar-light bg-light">
                        <a className="navbar-brand" href="#">Сервис электронных рецептов</a>
                    </nav>
                    <div className="container align-content-center align-items-center">
                        <div className="row"  style={{height: "150px"}}>
                            <button className="col m-2 btn btn-info font-weight-bolder" style={{fontSize: "x-large"}} onClick={this.handleDoctorClick}>
                                {"Доктор"}
                            </button>
                            <button className="col m-2 btn btn-danger font-weight-bolder" style={{fontSize: "x-large"}} onClick={this.handlePatientClick}>
                                {"Пациент"}
                            </button>
                            <button className="col m-2 btn btn-success font-weight-bolder" style={{fontSize: "x-large"}} onClick={this.handlePharmacyClick}>
                                {"Аптека"}
                            </button>
                        </div>

                    </div>
                </div>
            )
        );
    }
}

export default MainApp;
