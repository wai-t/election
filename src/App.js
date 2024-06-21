import './App.css';
import React, { useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

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

const old_constituencies = Object.fromEntries(last_election_data.map((row) => { return [row["Constituency name"], row]; }));
const new_constituencies = Object.keys(new_constituency_mapping);


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
  const [stdDeviations, setStdDeviations] = useState([10, 1, 0.5]);
  // const [constituency_forecasts, setConstituencyForecasts] = useState(compute_old_constituency_forecasts(national_forecast));
  const [constituency_forecasts, setConstituencyForecasts] = useState(compute_new_constituency_forecasts(national_forecast, factors, stdDeviations));
  const [seats, setSeats] = useState(compute_seats(constituency_forecasts));


  let adjuster = function (index, amount) {
    setFactors((factors) => { factors[index] += amount; return factors.map(i => i); })
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
    // let new_constituency_forecasts = compute_old_constituency_forecasts(new_forecast);
    let new_constituency_forecasts = compute_new_constituency_forecasts(new_forecast, factors, stdDeviations);
    setConstituencyForecasts(new_constituency_forecasts);
    setSeats(compute_seats(new_constituency_forecasts));
  }

  let stdDevAdjuster = function (index, amount) {
    console.log("stdDevAdjuster");

    stdDeviations[index] += amount;
    if (stdDeviations[index]<0) {stdDeviations[index]=0};

    let new_constituency_forecasts = compute_new_constituency_forecasts(national_forecast, factors, stdDeviations);
    setStdDeviations((dev) => { return stdDeviations })
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

          }
          <th colSpan="3">adjust factor</th>
          <th colSpan="3">adjust deviation</th></tr></thead>
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
                    <td><button onClick={() => stdDevAdjuster(index, 1)}>+</button></td>
                    <td><button onClick={() => stdDevAdjuster(index, -1)}>-</button></td>
                    <td>{stdDeviations[index]}</td>
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
  console.log("CountryDetail");

  const [popup, setPopup] = useState({});

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
          <th>Previous name</th>
          <th>Carried over</th>
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
          <th>Probability</th>
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
  if (record[2] === record[3]) {
    announce = <td className="name">{record[2]} hold</td>;
  }
  else {
    announce = <td className="name">{record[2]} win from {record[3]}</td>;
  }

  let constituency_name = record[0]["Constituency name"];
  let previous_name = record[0]["Previous name"];
  let name_changed = constituency_name.toUpperCase() !== previous_name.toUpperCase();

  let contributors = record[4];

  let prob;
  if (record[5]) {
    prob = <td>{Math.round(record[5]*100)}%</td>;
  }
  else {
    prob = <td></td>;
  }

  return (
    <tr key={index}>
      <td className="name">{record[0]["Constituency name"]}</td>
      <td className="name">{name_changed ? record[0]["Previous name"] : ""}</td>
      <td className="name">
        <Popup trigger={<button>{record[0]["weight"]}%</button>}>
        <div class="hover">
          <p>The Constituency of {record[0]["Constituency name"]} is formed from the following constituencies of the 2019 election</p>
          <table>
            <thead><tr>
              <th>Weight</th>
              <th>Constituency</th>
              <th>Member</th>
              <th>Party</th>
              {party_list.map((party, index)=>(<th key={index}>{party}</th>))}
            </tr></thead>
            <tbody>
              {contributors.map((c,r) => (
                <tr key={r}>
                  <td>{c[0]}</td>
                  <td>{c[1]["Constituency name"]}</td>
                  <td>{c[1]["Member first name"]} {c[1]["Member surname"]}</td>
                  <td>{c[1]["First party"]}</td>
                  {
                    party_list.map((party) => (
                      <td>{c[1][party]}</td>
                    ))
                  }
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Popup> 
      </td>
      <td className="name">{record[0]["Member first name"] + " " + record[0]["Member surname"]}</td>
      <td className="name">{record[0]["First party"]}</td>
      {
        party_list.map((party, id) => (
          <td key={id} className="number">{record[0][party]}</td>
        ))
      }
      {
        party_list.map((party, id) => (
          <td key={id} className="number">{String(Math.round(record[1][party])) + "%"}</td>
        ))
      }
      {announce}
      {prob}
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

function compute_old_constituency_forecasts(national_forecast) {

  let ret = [];

  for (let item of last_election_data) {
    let forecast = compute_constituency_forecast(item, national_forecast)
    ret.push([item, forecast[0], forecast[1], forecast[2]]);
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
    total[forecast[0]["Country name"]][forecast[2]]++;
    total["UK"][forecast[2]]++;
    if (forecast[2] !== forecast[3]) {
      change[forecast[0]["Country name"]][forecast[3]]--;
      change[forecast[0]["Country name"]][forecast[2]]++;
      change["UK"][forecast[3]]--;
      change["UK"][forecast[2]]++;
    }
  }
  return [total, change];
}

function compute_new_constituency_forecasts(national_forecast, factors, stdDeviations) {

  console.log("compute_new_constituency_forecasts");
  // [[item, [{"party", %}, winner, pred]]]]
  let old_constituency_forecasts = compute_old_constituency_forecasts(national_forecast);

  let old_constituency_lookup = Object.fromEntries(old_constituency_forecasts.map((row)=>{return [row[0]["Constituency name"].toUpperCase(), row]}));

  let ret = [];

  for (let new_constituency of new_constituencies) {
    let map = new_constituency_mapping[new_constituency];
    let forecast = {
      "Constituency name": new_constituency,
    }

    let [prev_constituency, weight] = find_max_prop(map);
    if (!prev_constituency) {debugger}
    let last_result = old_constituency_lookup[prev_constituency.toUpperCase()];
    if (!last_result) {debugger;continue;}

    const country = last_result[0]["Country name"];
    const party_list = party_lists[country];

    let new_constituency_forecast = {};
    let new_constituency_total = 0.0;
    party_list.forEach((party) => {new_constituency_forecast[party] = 0;});

    let contributors = [];

    let map_list = Object.entries(map);
    map_list.sort((a,b) => {return b[1] - a[1];});
    for (let map_entry of map_list) {
      const old_constituency_name = map_entry[0];
      const weight = map_entry[1];
      party_list.forEach((party) => {
        new_constituency_forecast[party] += weight * old_constituency_lookup[old_constituency_name.toUpperCase()][1][party];
        new_constituency_total += weight * last_result[1][party]
      });
      contributors.push([weight,...old_constituency_lookup[old_constituency_name.toUpperCase()]]);
    }
    
    party_list.forEach((party) => {
      new_constituency_forecast[party] /= (new_constituency_total * 0.01);
    });

    let winner = find_max_prop(new_constituency_forecast);

    let probability;
    if (stdDeviations && country !== "Northern Ireland") {
      let unsorted = Object.entries(new_constituency_forecast);
      let sorted = unsorted.sort((p1,p2) => p2[1]-p1[1]);
      let winner = sorted[0][0];
      let second = sorted[1][0];
      let margin = sorted[0][1] - sorted[1][1];
      // console.log(pca);
      let varb = ((pca[0][winner] - pca[0][second])*stdDeviations[0])**2
      + ((pca[1][winner] - pca[1][second])*stdDeviations[1])**2
      + ((pca[2][winner] - pca[2][second])*stdDeviations[2])**2;
      let sd = Math.sqrt(varb);
      probability = probability_fn(margin, sd);
      // console.log(probability);
    }
    let prev_result = {
      "weight": map_list[0][1],
      "Constituency name": new_constituency,
      "Previous name":  last_result[0]["Constituency name"],
      "Country name": country,
      "Member first name":  last_result[0]["Member first name"],
      "Member surname":  last_result[0]["Member surname"],
      "First party":  last_result[0]["First party"],
    };
    party_list.forEach((party) => {
      prev_result[party] = last_result[0][party];
    });


    ret.push(
      [
        prev_result,
        new_constituency_forecast,
        winner[0],
        last_result[0]["First party"],
        contributors,
        probability
      ]
    )

  }

  return ret;
}

function find_max_prop(l) {
  let ind = "";
  let max = -Infinity;

  for (let i of Object.keys(l)) {
    if (l[i] > max) {
      ind = i;
      max = l[i];
    }
  }

  return [ind, max];
}

function normalcdf(X){   //HASTINGS.  MAX ERROR = .000001
	var T=1/(1+.2316419*Math.abs(X));
	var D=.3989423*Math.exp(-X*X/2);
	var Prob=D*T*(.3193815+T*(-.3565638+T*(1.781478+T*(-1.821256+T*1.330274))));
	if (X>0) {
		Prob=1-Prob
	}
	return Prob
}   

function probability_fn(Z, SD) {
    let M=0;
    let Prob;
		if (SD<0) {
			alert("The standard deviation must be nonnegative.")
		} else if (SD==0) {
		    if (Z<M){
		        Prob=0
		    } else {
			    Prob=1
			}
		} else {
			Prob=normalcdf((Z-M)/SD);
			Prob=Math.round(100000*Prob)/100000;
		}
    return Prob;
}
export default App;
