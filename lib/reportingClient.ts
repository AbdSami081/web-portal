import axios from "axios";

const reportingClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_ReportingApi_URL,
});

export default reportingClient;
