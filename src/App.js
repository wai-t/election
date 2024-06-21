import './App.css';
import React, { useState } from 'react';

import last_election_data from './scaled.json';
import latest_forecast from "./latest.json";
import pca from "./polls_pca.json";
import new_constituency_mapping from "./new_constituency_mapping.json";

const party_lists =
{
  "England": ["CON", "LAB", "LD", "REF", "GRN"],
  "Scotland": ["CON", "LAB", "LD", "REF", "GRN", "SNP"],
  "Wales": ["CON", "LAB", "LD", "REF", "GRN", "PC"],
  "Northern Ireland": ["DUP", "SF", "SDLP", "UUP", "APNI"],
};

const all_parties = ["CON", "LAB", "LD", "REF", "GRN", "SNP", "PC", "DUP", "SF", "SDLP", "UUP", "APNI"];

const old_constituencies = last_election_data.map((row) => { return row["Constituency name"] });
const new_constituencies = new_constituency_mapping.keys;


const latest_forecast_plus_NI = {
  ...latest_forecast,
  "SF": 31,
  "DUP": 25,
  "APNI": 15,
  "UUP": 11,
  "SDLP": 9,
}

let country_weighting = {};
let total = 0;
for (let row of last_election_data) {
  total = total + 1;
  for (let party of party_lists[row["Country name"]]) {
    if (!country_weighting.hasOwnProperty(party)) country_weighting[party] = 0;
    country_weighting[party] += 1;
  }
}
Object.keys(country_weighting).forEach((party) => { country_weighting[party] = total / country_weighting[party] })



function App() {

  const [national_forecast, setNationalForecast] = useState(latest_forecast_plus_NI);
  const [factors, setFactors] = useState([0, 0, 0]);
  const [constituency_forecasts, setConstituencyForecasts] = useState(compute_forecast(national_forecast));
  const [seats, setSeats] = useState(compute_seats(constituency_forecasts));

  let adjuster = function (index, amount) {
    setFactors(factors => { factors[index] += amount; return factors.map(i => i); })
    let new_forecast = {}
    all_parties.forEach((party) => {
      if (pca[index][party]) {
        new_forecast[party] = national_forecast[party] + pca[index][party] * amount;
      }
      else {
        new_forecast[party] = national_forecast[party]
      }
    })
    setNationalForecast(forecast => new_forecast);
    let new_constituency_forecasts = compute_forecast(new_forecast);
    setConstituencyForecasts(new_constituency_forecasts);
    setSeats(compute_seats(new_constituency_forecasts));
  }

  return (
    <div className="App">
      <header className="App-header">
        Election Forecaster
      </header>

      <NationalForecast national_forecast={national_forecast} seats={seats} />
      <div className="control_panel">
        <table>
          <thead><tr><th>Principal Component</th>{
            all_parties.map((party, id) => (
              <th key={id}>{party}</th>
            ))

          }<th colSpan="2">adjust</th><th>factor</th></tr></thead>
          <tbody>
            {
              pca.map((vector, index) => {
                return (
                  <tr key={index}>
                    <th>{index}</th>
                    {all_parties.map((party, id) => (
                      <td key={id}>{vector[party]}</td>
                    ))}
                    <td><button onClick={() => adjuster(index, 1)}>+</button></td>
                    <td><button onClick={() => adjuster(index, -1)}>-</button></td>
                    <td>{factors[index]}</td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
      <CountryDetail key="England" country="England" constituency_forecasts={constituency_forecasts} seats={seats} />
      <CountryDetail key="Scotland" country="Scotland" constituency_forecasts={constituency_forecasts} seats={seats} />
      <CountryDetail key="Wales" country="Wales" constituency_forecasts={constituency_forecasts} seats={seats} />
      <CountryDetail key="Northern Ireland" country="Northern Ireland" constituency_forecasts={constituency_forecasts} seats={seats} />

    </div>
  );
}

function prefix_plus(num) {
  return (num > 0 ? "+" : "") + num;
}

function NationalForecast({ seats, national_forecast }) {

  return (
    <div>
      <div>
        <h3>UK</h3>
        <table>
          <thead>
            <tr><th></th>{
              all_parties.map((party, id) => (
                <th key={id} className="party_name">{party}</th>
              ))
            }
            </tr>
          </thead>
          <tbody>
            <tr><th>Vote share</th>{
              all_parties.map((party, id) => (
                <td key={id} className="number">{Math.round(national_forecast[party])}</td>
              ))
            }
            </tr>
            <tr><th>predicted seats</th>{
              all_parties.map((party, id) => (
                <td key={id} className="number">{seats[0]["UK"][party]}</td>
              ))
            }
            </tr>
            <tr><th>change+/-</th>{
              all_parties.map((party, id) => (
                <td key={id} className="number">{prefix_plus(seats[1]["UK"][party])}</td>
              ))
            }
            </tr>
          </tbody>
        </table>
      </div>
      {Object.keys(party_lists).map((country, id) => (
        <div key={id} className="country_section">
          <h3>
            {country}
          </h3>
          <table>
            <thead><tr><th></th>{
              party_lists[country].map((party, id) => (
                <th key={id}>{party}</th>
              ))
            }
            </tr></thead>
            <tbody>
              <tr><th>predicted seats</th>{
                party_lists[country].map((party, id) => (
                  <td key={id} className="number">{seats[0][country][party]}</td>
                ))
              }
              </tr>
              <tr><th>change+/-</th>{
                party_lists[country].map((party, id) => (
                  <td key={id} className="number">{seats[1][country][party]}</td>
                ))
              }
              </tr>
            </tbody>
          </table>
        </div>
      ))}

    </div>
  );
}

function CountryDetail({ country, constituency_forecasts, seats }) {

  let party_list = party_lists[country];

  let constituencies = constituency_forecasts.filter((record) => { return record[0]["Country name"] === country });

  return (
    <div>
      <table>
        <thead><tr>
          <th colSpan="3">{country}</th>
          <th colSpan={party_list.length}>2019 votes</th>
          <th colSpan={party_list.length + 1}>Forecast %</th>
        </tr></thead>
        <thead><tr>
          <th>Constituency</th>
          <th>Member</th>
          <th>Party</th>
          {
            party_list.map((party, id) => (
              <th key={id}>{party}</th>
            ))
          }
          {
            party_list.map((party, id) => (
              <th key={id}>{party}</th>
            ))
          }
          <th>Winner</th>
        </tr></thead>
        <tbody>
          {
            constituencies.map((record, index) => (
              <ConstituencyDetail record={record} index={index} key={index} />
            ))}
        </tbody>
      </table>
    </div>
  )
}

function ConstituencyDetail({ record, index }) {

  let party_list = party_lists[record[0]["Country name"]];
  let announce;
  if (record[1][1] === record[1][2]) {
    announce = <td className="name">{record[1][1]} hold</td>;
  }
  else {
    announce = <td className="name">{record[1][1]} win from {record[1][2]}</td>;
  }

  return (
    <tr key={index}>
      <td className="name">{record[0]["Constituency name"]}</td>
      <td className="name">{record[0]["Member first name"] + " " + record[0]["Member surname"]}</td>
      <td className="name">{record[0]["First party"]}</td>
      {
        party_list.map((party, id) => (
          <td key={id} className="number">{record[0][party]}</td>
        ))
      }
      {
        party_list.map((party, id) => (
          <td key={id} className="number">{String(Math.round(record[1][0][party])) + "%"}</td>
        ))
      }
      {announce}
    </tr>
  )
}


function party_forecast(party, item, national_forecast) {
  let pct = item[party + "_pct_scaled"] * country_weighting[party];
  if (pct <= 0) pct = 1.0;
  return pct * national_forecast[party];
}


function compute_constituency_forecast(item, national_forecast) {

  const party_list = party_lists[item["Country name"]];

  let total_pct = party_list
    .map(party => {
      return party_forecast(party, item, national_forecast);
    })
    .reduce((acc, party) => {
      return acc += party;
    }, 0);
  let forecast_result_list = party_list.map(party => { return [party, 100 * party_forecast(party, item, national_forecast) / total_pct] });

  forecast_result_list.sort((a, b) => b[1] - a[1]);
  let winner = forecast_result_list[0][0];
  let predecessor = item["First party"];

  let constituency_forecast = Object.fromEntries(forecast_result_list);
  return [constituency_forecast, winner, predecessor];
}

function compute_forecast(national_forecast) {

  let ret = [];

  for (let item of last_election_data) {
    ret.push([item, compute_constituency_forecast(item, national_forecast)]);
  }

  return ret;
}

function compute_seats(constituency_forecasts) {
  let total = { "UK": {} };
  let change = { "UK": {} };
  for (let c in party_lists) {
    total[c] = {};
    change[c] = {};
    for (let p of party_lists[c]) {
      total[c][p] = 0;
      total["UK"][p] = 0;
      change[c][p] = 0;
      change["UK"][p] = 0;
    }
  }


  for (let forecast of constituency_forecasts) {
    total[forecast[0]["Country name"]][forecast[1][1]]++;
    total["UK"][forecast[1][1]]++;
    if (forecast[1] !== forecast[2]) {
      change[forecast[0]["Country name"]][forecast[1][2]]--;
      change[forecast[0]["Country name"]][forecast[1][1]]++;
      change["UK"][forecast[1][2]]--;
      change["UK"][forecast[1][1]]++;
    }
  }
  return [total, change];
}


export default App;
