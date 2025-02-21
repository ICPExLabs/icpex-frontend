import axios from "axios";
import { BASE_URL } from "../constants";

export interface BaseResponse<T = any> {
  retCode: number;
  retMsg: string;
  data: T;
}

export interface ListResponse<T = any> {
  retCode: number;
  retMsg: string;
  totalCount: number;
  data: T;
}

const request = axios.create({
  baseURL: BASE_URL,
});

export default request;
