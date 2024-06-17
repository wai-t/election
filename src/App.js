import './App.css';
import React, {useState} from 'react';

import last_election_data from './scaled.json';
import latest_forecast from "./latest.json";
import pca from "./polls_pca.json";

const party_lists = 
{
  "England": ["CON","LAB","LD","REF","GRN"],
  "Scotland": ["CON","LAB","LD","REF","GRN","SNP"],
  "Wales": ["CON","LAB","LD","REF","GRN","PC"],
  "Northern Ireland": ["DUP","SF","SDLP","UUP","APNI"],
};

const all_parties = ["CON","LAB","LD","REF","GRN","SNP","PC","DUP","SF","SDLP","UUP","APNI"];

function App() {

  let weights = {};
  let total = 0;
  for (let row of last_election_data) {
    total = total + 1;
    for (let party of party_lists[row["Country name"]]) {
      if (!weights.hasOwnProperty(party)) weights[party] = 0;
      weights[party] += 1;
    }
  }
  Object.keys(weights).forEach((party) => {weights[party] = total/weights[party]})

  const latest_forecast_plus_NI = {
    ...latest_forecast,
    "SF": 31,
    "DUP": 25,
    "APNI": 15,
    "UUP": 11,
    "SDLP": 9,
  }

  const [last_election /*setLastElection*/] = useState(last_election_data);
  const [national_forecast, setNationalForecast] = useState(latest_forecast_plus_NI);
  const [forecast_weights/*, setForecastWeights*/] = useState(weights);

  const [total_seats, setTotalSeats] = useState({"England":{},"Northern Ireland":{},"Scotland":{}, "Wales":{}});
  const [total_change, setTotalChange] = useState({"England":{},"Northern Ireland":{},"Scotland":{}, "Wales":{}});

  const [factors, setFactors] = useState([0,0,0]);

  let totals_updater = function(country, seats, changes) {
    if (JSON.stringify(total_seats[country]) !== JSON.stringify(seats)) {

      setTotalSeats(total_seats => {return {
        ...total_seats,
        [country]: seats
      }});
    }
    if (JSON.stringify(total_change[country]) !== JSON.stringify(changes)) {

      setTotalChange(total_change => {return {
        ...total_change,
        [country]: changes
      }});
    }
  }

  let adjuster = function(index, amount) {
    setFactors( factors => {factors[index] += amount; return factors.map(i=>i);})
    let new_forecast = {}
    all_parties.forEach((party) => {
      if (pca[index][party]) {
        new_forecast[party] = national_forecast[party] + pca[index][party]*amount;
      }
      else {
        new_forecast[party] = national_forecast[party]
      }
    })
    setNationalForecast(forecast => new_forecast);
  }

  return (
    <div className="App">
      <header className="App-header">
        Election Forecaster
      </header>

      <Forecast forecast={national_forecast} total_seats={total_seats} total_change={total_change}/>
      <div className="control_panel">
        <table>
          <thead><th>Principal Component</th>{
              all_parties.map((party) => (
                <th>{party}</th>
              ))
              
          }<th colSpan="2">adjust</th><th>factor</th></thead>
          <tbody>
              {
                pca.map((vector, index) => { return (
                  <tr>
                  <th>{index}</th>
                  {all_parties.map((party) => (
                    <td>{vector[party]}</td>
                  ))}
                  <td><button onClick={()=>adjuster(index, 1)}>+</button></td>
                  <td><button onClick={()=>adjuster(index, -1)}>-</button></td>
                  <td>{factors[index]}</td>
                  </tr>
                )})
              }
          </tbody>
        </table>
      </div>
      <CountrySummary key="England" country="England" forecast={national_forecast} last_election={last_election} weights={forecast_weights} totals_updater={totals_updater} />
      <CountrySummary key="Scotland" country="Scotland" forecast={national_forecast} last_election={last_election} weights={forecast_weights} totals_updater={totals_updater} />
      <CountrySummary key="Wales" country="Wales" forecast={national_forecast} last_election={last_election} weights={forecast_weights} totals_updater={totals_updater} />
      <CountrySummary key="Northern Ireland" country="Northern Ireland" forecast={national_forecast} last_election={last_election} weights={forecast_weights} totals_updater={totals_updater} />

    </div>
  );
}

function Forecast(props) {

  function get_national_totals(totals_by_country) {
    let national_seats = {};
    for (let party of all_parties) {
      national_seats[party] = 0;
    }
    Object.keys(party_lists).forEach ((country) => {
      party_lists[country].forEach((party) => {
        if (totals_by_country[country].length>0)
          console.log(totals_by_country[country])
          national_seats[party] += totals_by_country[country][party];
      })
    })
    return national_seats;
  }

  function prefix_plus(num) {
    return (num>0? "+" : "") + num;
  }
  
  // console.log("Forecast component");
  // console.log(national_seats);

  return (
    <div>
      <div>
      <h3>UK</h3>
      <table>
        <thead>
          <tr><th></th>{
          all_parties.map((party) => (
              <th class="party_name">{party}</th>
            ))
          }
          </tr>
        </thead>
        <tbody>
          <tr><th>Vote share</th>{
            all_parties.map((party) => (
              <td className="number">{Math.round(props.forecast[party])}</td>
            ))
            }
          </tr>
          <tr><th>predicted seats</th>{
            all_parties.map((party) => (
              <td className="number">{get_national_totals(props.total_seats)[party]}</td>
            ))
            }
          </tr>
          <tr><th>change+/-</th>{
            all_parties.map((party) => (
              <td className="number">{prefix_plus(get_national_totals(props.total_change)[party])}</td>
            ))
            }
          </tr>
        </tbody>
      </table>
      </div>
      {Object.keys(party_lists).map((country) => (
        <div className="country_section">
          <h3>
          {country}
          </h3>
          <table>
          <thead><th></th>{
          party_lists[country].map((party) => (
            <th>{party}</th>
          ))
        }
        </thead>
        <tr><th>predicted seats</th>{
          party_lists[country].map((party) => (
            <td className="number">{props.total_seats[country][party]}</td>
          ))
          }
        </tr>
        <tr><th>change+/-</th>{
          party_lists[country].map((party) => (
            <td className="number">{props.total_change[country][party]}</td>
          ))
          }
        </tr>

          </table>
        </div>
      ))}

    </div>
  );
}

function CountrySummary(props) {

  const [seats, setSeats] = useState({});
  const [change, setChange] = useState({});

  const party_list = party_lists[props.country];

  function compute_forecast() {
    
    function compute_constituency_forecast(item) {

      function party_forecast( party, item) {
        let pct = item[party+"_pct_scaled"] * props.weights[party];
        if (pct<=0) pct = 1.0;
        return pct * props.forecast[party];
      }

      let total_pct = party_lists[props.country]
                      .map(party=> {
                                    return party_forecast(party, item);
                                  })
                                      .reduce((acc, party) => {
                                        return acc += party;
                                      }, 0);
      let list = party_lists[props.country].map(party=>{return [party, 100* party_forecast(party, item) / total_pct]});
      
      list.sort((a,b) => b[1] - a[1]);
      let winner = list[0][0];
      let announce;
      if (winner!==item["First party"]) {
        let loser = item["First party"];
        announce = winner + " win from " + loser;
        new_change[winner] = new_change[winner] + 1;
        new_change[loser] = new_change[loser] - 1;
      }
      else {
        announce = winner + " hold";
      }

      new_seats[winner] += 1;
    
      let party_result = Object.fromEntries(list);
      return [party_result, announce];
    }

    let new_change = {};
    let new_seats = {}
    for (let party of party_list) {
      new_change[party] = 0;
      new_seats[party] = 0;
    }


    let ret = [];

    for (let item of props.last_election.filter((item) =>  {
      return item["Country name"] === props.country;
      })) {
        ret.push([item, compute_constituency_forecast(item)]);
      }

    if (JSON.stringify(new_change) !== JSON.stringify(change)
        || JSON.stringify(new_seats) !== JSON.stringify(seats) ) {
      props.totals_updater(props.country, new_seats, new_change);
      setSeats(new_seats);
      setChange(new_change);
    }

    return ret;
  }

  let constituency_forecasts = compute_forecast(); // [item, [{forecasts}, announce]]

  return (
    <div>
        <table>
          <thead>
            <th></th>
            <th colspan="2"></th>
            <th colspan={party_lists[props.country].length}>2019 votes</th>
            <th colSpan={party_lists[props.country].length}>Forecast %</th>
            <th>Forecast Winner</th>
          </thead>
          <thead>
            <th></th>
            <th colspan="2"></th>
            <th colspan={party_lists[props.country].length}></th>
            {
              party_lists[props.country].map((party, index) => (
                <th>{seats[party]}</th>
              ))
            }
            <th colSpan={party_lists[props.country].length}></th>
            <th></th>
          </thead>
          <thead>
            <th></th>
            <th colspan="2"></th>
            <th colspan={party_lists[props.country].length}></th>
            {
              party_lists[props.country].map((party, index) => (
                <th>{change[party]}</th>
              ))
            }
            <th colSpan={party_lists[props.country].length}></th>
            <th></th>
          </thead>
        <thead>
          <th>Constituency</th>
          <th>Member</th>
          <th>Party</th>
          {
            party_lists[props.country].map((party) => (
              <th>{party}</th>
            ))
          }
          {
            party_lists[props.country].map((party) => (
              <th>{party}</th>
            ))
          }
        </thead>
        <tbody>
          {
            // props.last_election
            constituency_forecasts.map((record, index) => (
              <ConstituencyDetail country={props.country} record={record} index={index} forecast={props.forecast} weights={props.weights}/>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ConstituencyDetail(props) {

  return (
    <tr key={props.index}>
    <td className="name">{props.record[0]["Constituency name"]}</td>
    <td className="name">{props.record[0]["Member first name"] + " " +props.record[0]["Member surname"]}</td>
    <td className="name">{props.record[0]["First party"]}</td>
    {
      party_lists[props.country].map((party) => (
        <td className="number">{props.record[0][party]}</td>
      ))
    }
    {
      party_lists[props.country].map((party) => (
        // <td>{Math.round(party_forecast(props.item, party, props.forecast))}</td>
        <td className="number">{String(Math.round(props.record[1][0][party])) + "%"}</td>
      ))
    }
    {/* <td>{forecast_result(props.item, props.forecast)}</td> */}
    <td className="name">{props.record[1][1]}</td>
    </tr>

  )  
}

export default App;
