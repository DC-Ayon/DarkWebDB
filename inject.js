const fs = require('fs');
const readline = require('readline');
const { Client } = require('@elastic/elasticsearch');



const esClient = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'f1KxdjdqCZ7jEfjiMpFg'
  },
  tls: {
    rejectUnauthorized: false 
  }
});

async function injectFromTxt(filePath) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });

  let counter = 1;

  for await (const line of rl) {
    const [email, password] = line.split(':').map(s => s.trim());
    if (!email || !password) continue;

    await esClient.index({
      index: 'users',
      id: counter++,
      document: { email, password }
    });
  }

  await esClient.indices.refresh({ index: 'users' });
  console.log('✅ Encrypted Elasticsearch injection complete');
}

injectFromTxt('D:\\INTERN\\DarkWebTeam_Databases\\Ritesh Jha\\RiteshJha-DB4-(6L)Email&Passwords.txt');
