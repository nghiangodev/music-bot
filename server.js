
const express = require("express")

const server = express()

server.all("/", (req, res) => {
    res.send('Darth is running !')
  })

  function keepAlive() {
    server.connect({
        port: process.env.PORT || 3000 
    });
  }

  module.exports = keepAlive