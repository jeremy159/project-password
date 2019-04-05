const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const admin = require('firebase-admin');

const serviceAccount = require('./FB-db-key/projet-password-firebase-adminsdk-i89tz-7b4fa8b817.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://projet-password.firebaseio.com'
});

const db = admin.database();
// const db = admin.firestore();
// const collection = db.collection('passwords-list');
const ref = db.ref('server/database');
const passwordsRef = ref.child('passwords');

let addToDatabase = (index, username, password) => {
    // console.log(`Ajout ${index} - u: ${username}\tp: ${password}`);
    // collection.doc(index.toString()).set({
    //     username: username,
    //     password: password
    // });
    passwordsRef.child(index).set({
            username: username,
            password: password
    });
};

const filename = process.argv[2]
if (filename) {
    const instream = fs.createReadStream(filename);
    const outstream = new stream();
    const reader = readline.createInterface(instream, outstream);
    const digits = filename.match(/\d+/g);
    let lineIdx = (digits[1] - 1) * 500000;

    reader.on('line', (line) => {
        const [username, password, _] = line.split(/\t|\s/g);
        if (username !== undefined && password !== undefined) {
            addToDatabase(lineIdx, username, password);
        }
        lineIdx++;
    });

    reader.on('close', () => {
        console.log('FINISH');
    });
}
else {
    console.error('Auncun nom de fichier passé en paramètre...');
}

// fs.readFile('./data/10-million-combos.txt', 'utf8', (err, data) => {
//     if (err) throw err;
//     console.log(`data lenght loaded = ${data.length}`);
//     splitBigFile(data);
//     const lines = data.split('\n');
//     // loadTextFileToFB(lines);
//     // addToDatabase(0, 'usernameTest', 'passwordTest');
// });
