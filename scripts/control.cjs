const bcrypt = require('@node-rs/bcrypt');
const addon = require('../native/build/Release/hello.node');
const hash = bcrypt.hashSync('hello world', { cost: 4 });
console.log(JSON.stringify({ message: addon.hello(), hash, verified: bcrypt.verifySync('hello world', hash) }));
