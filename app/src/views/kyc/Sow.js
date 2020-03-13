import React, { useState } from "react";
import { setSourceOfFunds } from "api/onboarding";

import cn from "classnames/bind";

import Logo from "img/conditional-logo-color.svg";
import style from "./sow.scss";
const cx = cn.bind(style);

// Utils
import useBodyClass from "../../utils/use-body-class";

// const marketId = ({ this.props.match }) => match.params.id

const useInput = initialValue => {
  const [value, setValue] = useState(initialValue);

  return {
    value,
    setValue,
    reset: () => setValue(initialValue),
    bind: {
      value,
      onChange: event => {
        setValue(event.target.value);
      }
    }
  };
};

const getEmail = location => {
  const searchParams = new URLSearchParams(location.search);
  return searchParams.get("email") || "";
};

const Sow = props => {
  const [email, setEmail] = useState(getEmail(props.location));
  const [error, setError] = useState(null);

  const {
    value: sourceOfFunds,
    bind: bindSourceOfFunds,
    reset: resetSourceOfFunds
  } = useInput("0");
  const {
    value: companyName,
    bind: bindCompanyName,
    reset: resetCompanyName
  } = useInput("");
  const { value: pension, bind: bindPension, reset: resetPension } = useInput(
    ""
  );
  const {
    value: sourceDescription,
    bind: bindSourceDescription,
    reset: resetSourceDescription
  } = useInput("");
  const {
    value: currentJob,
    bind: bindCurrentJob,
    reset: resetCurrentJob
  } = useInput("");
  const {
    value: selfEmployedActivity,
    bind: bindSelfEmployedActivity,
    reset: resetSelfEmployedActivity
  } = useInput("");
  const {
    value: tradingVolume,
    bind: bindTradingVolume,
    reset: resetTradingVolume
  } = useInput("0");

  const handleChange = () => {};

  const renderSalary = () => {
    return sourceOfFunds === "salaried";
  };

  const renderSelfEmployed = () => {
    return sourceOfFunds === "self-employed";
  };

  const renderCompanySale = () => {
    return sourceOfFunds === "company-earnings";
  };

  const renderPension = () => {
    return sourceOfFunds === "pension";
  };

  const renderSourceOfFundsDescription = () => {
    return (
      sourceOfFunds !== "salaried" &&
      sourceOfFunds !== "self-employed" &&
      sourceOfFunds !== "company-earnings" &&
      sourceOfFunds !== "pension" &&
      sourceOfFunds !== "0"
    );
  };

  const handleSubmit = event => {
    event.preventDefault();
    const sow = {
      email,
      mainSource: sourceOfFunds || undefined,
      saleCompanyName: companyName || undefined,
      pension: pension || undefined,
      description: sourceDescription || undefined,
      currentJob: currentJob || undefined,
      selfEmployedActivity: selfEmployedActivity || undefined,
      expectedAnnualTradingVolume: tradingVolume || undefined
    };

    setSourceOfFunds(sow)
      .then(response => {
        switch (response.status) {
          case 201:
            resetSourceOfFunds();
            resetCompanyName();
            resetPension();
            resetSourceDescription();
            resetCurrentJob();
            resetSelfEmployedActivity();
            resetTradingVolume();
            return response.json();
          case 400:
            setError("Error in data params");
            break;
          case 401:
            setError("Error: KYC was already sent for this email");
            break;
          case 404:
            setError("Error: Email not found");
            break;
        }
      })
      .then(result => {
        if (result) {
          const { url } = result;
          window.location.href = url;
        }
      })
      .catch(e => {
        console.log(e);
        setError("Error: Internal error, please try later");
      });
  };

  useBodyClass(style.sow);
  return (
    <main className={cx("sow-content")}>
      <nav>
        <a href="/" className={cx("logo")} title="Sight - Sign Up">
          <img src={Logo} height="40" width="116" alt="Sight - Logo" />
        </a>
      </nav>
      <div className={cx("column")}>
        <h1>
          Sight Self Declared <br />
          Source of Funds
        </h1>

        <form
          className={cx("form")}
          id="sow_form"
          name="sow_form"
          onSubmit={handleSubmit}
        >
          <p>
            To be regulated under Gibraltar's Distributed Ledger Technology
            (DTL) framework we are required to collect information on your
            source of funds.
          </p>
          <br />
          <p>
            <span className={cx("text-red")}>*</span> Required
          </p>

          <span>
            <strong>
              What is your main source of funds?{" "}
              <small className={cx("text-red")}>*</small>
            </strong>
            <select
              name="source_of_funds"
              required
              onChange={handleChange}
              {...bindSourceOfFunds}
            >
              <option value="0" disabled>
                - Choose -
              </option>
              <option value="salaried">Employment income (salaried)</option>
              <option value="self-employed">
                Employment income (self-employed)
              </option>
              <option value="gift">Gift</option>
              <option value="pension">Pension</option>
              <option value="investments-income">
                Income from Investments
              </option>
              <option value="tax-rebates">Tax Rebates</option>
              <option value="cryptocurrency-trading">
                Cryptocurrency Trading
              </option>
              <option value="investments">
                Proceeds from sale of investments/liquidation of investment
                portfolio
              </option>
              <option value="property-sale">
                Proceeds from sale of property
              </option>
              <option value="company-earnings">
                Proceeds from sale of company or interest in a company
              </option>
              <option value="rental-income">Rental Income</option>
              <option value="other">Other</option>
            </select>
          </span>

          {renderCompanySale() ? (
            <span>
              <h3>Company Sale</h3>
              <strong>
                Please insert the name of the company{" "}
                <small className={cx("text-red")}>*</small>
              </strong>
              <input name="company_name" required {...bindCompanyName} />
            </span>
          ) : null}

          {renderPension() ? (
            <span>
              <h3>Pension</h3>
              <strong>
                Please indicate if private or government pension{" "}
                <small className={cx("text-red")}>*</small>
              </strong>
              <input name="pension" required {...bindPension} />
            </span>
          ) : null}

          {renderSourceOfFundsDescription() ? (
            <span>
              <h3>Source of Funds Description</h3>
              <strong>
                Add specifics to your source of funds. Like "Sale of property in
                UK", "Family inheritance"{" "}
                <small className={cx("text-red")}>*</small>
              </strong>
              <input
                name="source_description"
                required
                {...bindSourceDescription}
              />
            </span>
          ) : null}

          {renderSalary() ? (
            <span>
              <h3>Salary</h3>
              <strong>
                Please insert the name of your employer and you current job
                title. <small className={cx("text-red")}>*</small>
              </strong>
              <input name="current_job" required {...bindCurrentJob} />
            </span>
          ) : null}

          {renderSelfEmployed() ? (
            <span>
              <h3>Self Employed</h3>
              <strong>
                Please describe your main economic activity{" "}
                <small className={cx("text-red")}>*</small>
              </strong>
              <input name="pension" required {...bindSelfEmployedActivity} />
            </span>
          ) : null}

          <span>
            <h3>Expected Annual Trading Volume</h3>
            <strong>
              How much do you intend to trade on Sight annually?{" "}
              <small className={cx("text-red")}>*</small>
            </strong>
            <select name="trading_volume" required {...bindTradingVolume}>
              <option value="0" disabled>
                - Choose -
              </option>
              <option value="1_0_15000">0 to 15000 Euro</option>
              <option value="2_15001_50000">15001 to 50000 Euro</option>
              <option value="3_50001">More than 50001 Euro</option>
            </select>
          </span>

          <button className={cx("button")}>Finish KYC</button>
          {error ? (
            <p>
              <span className={cx("text-red")}>{error}</span>
            </p>
          ) : null}
        </form>
      </div>
      <footer>
        <ul>
          <li>
            © <span id="year"></span> Gnosis Ops Limited
          </li>
          <li>
            <a
              href="/terms/TOS_SIGHT_JULY_2019.pdf"
              target="_blank"
              rel="noopener"
            >
              Terms & Conditions
            </a>
          </li>
          <li>
            <a href="/privacy.html" target="_blank" rel="noopener">
              Privacy Policy
            </a>
          </li>
          <li>
            <a href="/cookies.html" target="_blank" rel="noopener">
              Cookies
            </a>
          </li>
          <li>
            <a href="/imprint.html" target="_blank" rel="noopener">
              Imprint
            </a>
          </li>
        </ul>
      </footer>
    </main>
  );
};

export default Sow;
