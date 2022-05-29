'use strict';
import React, {Component} from 'react';
import {BrowserRouter} from 'react-router-dom'
import {Route, Router, Routes, Link} from 'react-router-dom'
import PharmacyApp from "./pharmacyApp";
import PatientApp from "./patientApp";
import DoctorApp from "./doctorApp";
import MainApp from "./mainApp";


const BaseLayout = () => (
    <div className=" h-100">
        <Routes>
            <Route path="/" element={<MainApp/>}/>
            <Route path="/doctor-interface" element={<DoctorApp />}/>
            <Route path="/patient-interface" element={<PatientApp />}/>
            <Route path="/pharmacy-interface" element={<PharmacyApp />}/>
        </Routes>
    </div>
)


class App extends Component {

    render() {
        return (
            <BrowserRouter>
                <BaseLayout/>
            </BrowserRouter>
        );
    }
}

export default App;
