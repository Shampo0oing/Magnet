const WebTorrent = require('webtorrent');
const client = new WebTorrent();
const archiver = require('archiver');

module.exports = class TorrentHelper {
    static magnetLink;

    static getMagnetFiles(magnet) {
        this.magnetLink = magnet;
        return new Promise((resolve, reject) => {

            // verifie si le torrent n'existe pas deja si oui, il le detruit
            if(client.get(magnet)) client.remove(magnet, () => console.log('\x1b[32m' + 'Torrent was already there so deleted'));

            // start downloading the torrent
            console.log('\x1b[32m' + 'start downloading the torrent')
            const torrent = client.add(magnet, { path: './torrents/'});
            client.on('error', function (err) { reject(err) })

            // check if metadata are ready
            console.log('\x1b[32m' + 'check if metadata are ready')
            torrent.on('metadata', () => {
                // met le torrent en pause
                console.log('\x1b[32m' + 'paused the torrent')
                torrent.pause();
                console.log('\x1b[32m' + 'Metadata found');
                console.log('\x1b[32m' + 'Torrent paused');

                // recupère les metadonnées de tout les fichiers du torrent
                const filesMetadata = TorrentHelper.createDirectoryTree(torrent.files);
                // stop le téléchargement et suprime le torrent
                client.remove(magnet, () => console.log('\x1b[32m' + 'Torrent deleted'));

                // return les metadonnées
                resolve(filesMetadata);
            });

            torrent.on('error', err => {
                reject(err)
            })
        });
    };
    static createDirectoryTree(files) {
        let result = [];
        let root = { result };
        let index = 0;
        const intersect = (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') ? '\\' : '/';
        files.forEach( (file, fileNum) => {
            console.log(file.path);
            file.path.split(intersect).reduce( (acc, current, i, pathArray) => {
                if(acc[current]) return acc[current];
                acc[current] = { result: [] };

                const item = (i === pathArray.length-1) ?
                    {   id: index++,
                        index: fileNum,
                        size: file.length,
                        name: TorrentHelper.getName(current),
                        extension: TorrentHelper.getExtension(current),
                        children: acc[current].result
                    } :
                    {   id: index++,
                        name: current,
                        children: acc[current].result
                    };

                acc.result.push(item);
                return acc[current];
            }, root);
        })
        return result;
    };
    static createReadableStream(filesIndex, res) {

        const magnet = this.magnetLink;

        if(client.get(magnet)) client.remove(magnet, () => console.log('\x1b[32m' + 'Torrent was already there so deleted'));

        client.on('error', function (err) {
            console.error(err);
        })

        //creation du zip
        const archive = archiver('zip', {
            zlib: { level: 0 } // Sets the compression level.
        });

        archive.store = true;

        let header = {
            "Content-Type": "application/zip",
            "Pragma": "public",
            "Expires": "0",
            "Cache-Control": "private, must-revalidate, post-check=0, pre-check=0",
            "Transfer-Encoding": "chunked",
            "Content-Transfer-Encoding": "binary"
        };

        // start downloading the torrent
        client.add(magnet, { path: './torrents/'}, async (ontorrent) => {

            ontorrent.files.forEach(file => file.deselect());
            ontorrent.deselect(0, ontorrent.pieces.length - 1, false);

            let totalSize = 0;
            filesIndex.split(',').forEach( index => {
                totalSize+= ontorrent.files[index].length;
            })

            ontorrent.on('download', function (bytes) {
                console.log('total downloaded: ' + ontorrent.downloaded)
                console.log('progress: ' + (archive.pointer() / totalSize).toFixed(2) *100 + " %" )
            })

            archive.on('end', function() {
                console.log('Archive wrote %d bytes', archive.pointer());
                client.remove(magnet, () => console.log('\x1b[32m' + 'Torrent was already there so deleted'));
            });

            archive.on('warning', function(err) {
                if (err.code === 'ENOENT') {
                    // log warning
                } else {
                    // throw error
                    throw err;
                }
            });

            archive.on('error', function(err) {
                throw err;
            });


            console.log('\x1b[32m' + 'Metadata found');
            console.log('\x1b[32m' + 'Generating readable stream ...');

            res.attachment(`${ontorrent.files[0].path.split('/').shift()}.zip`);
            header['Content-Disposition'] = 'attachment; filename=' + ontorrent.files[0].path.split('/').shift() + '.zip'

            res.writeHead(200, header);

            archive.pipe(res);

            for(const index of filesIndex.split(',')) {
                console.log('\x1b[32m' + 'Zipping file number: ' + index);
                archive.append(ontorrent.files[index].createReadStream(), { name: ontorrent.files[index].path });
                console.log('\x1b[32m' + 'File number: ' + index + ' append');
            }

            archive.finalize().then(res => {
                console.log('archive finalize correctly');
            }).catch(err=> console.error(err));

        });
    }
    static deleteTorrent() {

        try {
            client.remove(this.magnetLink, () => {
                console.log('\x1b[32m' + 'Torrent deleted');
                return true;
            });
        } catch(err) {
            console.log('\x1b[31m' + 'Failed to remove torrent, cause no torrent was found with this magnet id');
            return false;
        }
    }
    static getName(name) {
        return name.substring(0, name.lastIndexOf('.'));
    }
    static getExtension(name) {
        return name.split('.').pop();
    }
}