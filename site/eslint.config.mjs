import next from "eslint-config-next";

const config = [...next, { ignores: [".next/**", "out/**", "cgi/**"] }];
export default config;
