const fs = require('fs');
const readline = require('readline');
const stream = require('stream');

const index = process.argv[2]

if (index) {
    const instream = fs.createReadStream('./data/10-million-combos.txt');
    const outstream = new stream();
    const reader = readline.createInterface(instream, outstream);

    const writer = fs.createWriteStream(`./data/10-million-combos-${index}.txt`, {flags: 'a'});
    const start = (index - 1) * 500000;
    const end = index * 500000 - 1;

    lineIdx = 0;
    reader.on('line', (line) => {
        if (lineIdx >= start && lineIdx <= end) {
            writer.write(`${line}\n`);
        }
        else if (lineIdx > end) {
            reader.close();
        }
        lineIdx++;
    });
}
else {
    console.error('Index non valide ou non présent...');
}
