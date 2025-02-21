import "./main.less";
import React from "react";
import ReactDOM from "react-dom/client";
import Big from "big.js";
import App from "./App";

// the positive exponent value at and above which toString returns exponential notation
Big.PE = 50;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
