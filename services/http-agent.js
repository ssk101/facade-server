import http from 'http'
import https from 'https'

const agentOpts = {
  keepAlive: true,
  keepAliveMsecs: 15 * 1000,
  timeout: 300,
  maxSockets: 50,
}
const httpAgent = new http.Agent(agentOpts)
const httpsAgent = new https.Agent(agentOpts)

export default function(url) {
  return url.protocol == 'http:'
    ? httpAgent
    : httpsAgent
}
