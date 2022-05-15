<template>
  <v-container class="d-flex justify-center">
    <div class="torrent d-flex flex-column justify-center gap-2" style="width: 50%; padding: 2rem 0 3rem 0 !important">
      <v-text-field class="pt-5 inputEllipsis"
          v-model="magnetLink"
                    :disabled="searchLoading || downloading"
          label="Magnet URL"
          solo outlined style="outline: none"
          :rules="rules" prepend-inner-icon="mdi-magnet"
          :background-color="dark3Transparent"
          color="#9d9dae">
        <template #append>
          <v-btn color="transparent" elevation="0" :disabled="searchLoading || downloading" :loading="searchLoading" @click="getMagnetFiles()">
            <v-icon> mdi-magnify </v-icon>
          </v-btn>
        </template>
      </v-text-field>

      <v-snackbar v-model="snackbar.display" :timeout="snackbar.timeout" color="dark2" style="opacity: 0.95">
        {{ snackbar.text }}
        <template v-slot:action="{ attrs }">
          <v-btn :color="snackbar.isErr ? 'pink' : 'green'" icon v-bind="attrs" @click="snackbar.display = false"><v-icon> mdi-close-circle </v-icon></v-btn>
        </template>
      </v-snackbar>

      <v-card color="dark2" style="opacity: 0.95; flex: 1">
        <v-card-title v-if="this.directoryTree.length === 0" class="justify-center" style="color: var(--v-primary-base)">
          The files will appear here once the search is done
        </v-card-title>

        <v-card-text v-else>

          <div class="d-flex gap-2 align-center px-5">
            <v-switch label="Open directories" input-value="true" inset @change="$refs.tree.updateAll($event)"></v-switch>

            <v-spacer></v-spacer>

            <v-btn outlined color="secondary"  :loading="clearLoading" :disabled="clearLoading"
                   @click="clearFiles(true)">Clear</v-btn>


            <v-btn :loading="downloading" outlined color="primary"
                   :disabled="!(selectedNode.length > 0) || downloading"
                   @click="streamSelectedFiles()">Download
              <template #loader>
                <span>Loading...</span>
              </template>
            </v-btn>
          </div>

          <v-divider class="mt-4"></v-divider>

          <div class="d-flex px-2 py-4">
            <span style="flex: 1">File name</span>
            <div class="d-flex gap-3">
              <span class="fileFormat">Extension</span>
              <span class="fileFormat">Size</span>
            </div>
          </div>

          <v-treeview ref="tree"
                      :active.sync="selectedNode"
                      return-object
                      activatable
                      multiple-active
                      open-all
                      active-class="transparent"
                      selectable hoverable dense
                      :items="directoryTree"
                      v-model="selectedNode"
                      selected-color="primary"
                      item-key="id"
                      loading-icon="mdi-folder-open"
                      item-children="children"
                      transition
                      class="treeScroll">

            <template #prepend="{ item, open}">
              <v-icon v-if="item.children.length > 0">
                {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
              </v-icon>
              <v-icon v-else>
                {{ files[item.extension] ? files[item.extension] : 'mdi-file-question' }}
              </v-icon>
            </template>
            <template #append="{ item }">
              <div class="d-flex gap-3" v-if="item.children.length === 0">
                <span class="fileFormat">{{item.extension}}</span>
                <span class="fileFormat">{{formatByte(item.size)}}</span>
              </div>
              <div v-else>
                <span class="fileFormat">{{ formatByte(getFolderSize(item), 2) }}</span>
              </div>
            </template>
            <template #label="{ item }">
              <div>{{item.name}}</div>
            </template>
          </v-treeview>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script>
const axios = require('axios');
const streamSaver = require('streamsaver');
//const parseTorrent = require('parse-torrent');
const parseTorrent = require('magnet-uri');

export default {
  name: 'HelloWorld',
  data: () => ({
    magnetLink: 'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fbig-buck-bunny.torrent',
    baseURL: (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') ?  'http://localhost:3000' : '',
    rules: [
        value => value.length === 0 || value.startsWith('magnet:?') || 'Invalid Magnet'
    ],
    searchLoading: false,
    clearLoading: false,
    downloading: false,
    selectedNode: [],
    directoryTree: [],
    files: {
      html: 'mdi-language-html5',
      js: 'mdi-nodejs',
      json: 'mdi-code-json',
      md: 'mdi-language-markdown',
      pdf: 'mdi-file-pdf',
      png: 'mdi-file-image',
      jpg: 'mdi-file-image',
      txt: 'mdi-text',
      srt: 'mdi-file-document-outline',
      xls: 'mdi-file-excel',
      mp4: 'mdi-file-video',
      mp3: 'mdi-file-music',
      exe: 'mdi-file-cog',
      zip: 'mdi-folder-zip',
    },
    snackbar: { display: false, text: "Hello, I'm a snackbar", timeout: 3000, isErr: false},
  }),
  computed: {
      dark3Transparent() {
        return this.toRgba(this.$vuetify.theme.themes.dark.dark3);
      },

    },
    methods: {
      log(object) {
        console.log(this.getSelectedFilesTotalSize());
        console.log(object);
      },

      formatByte(value, digit = 1) {
        let e=Math.log2(value)/10|0;
        const extensions = ['B', 'Kb', 'Mb', 'Gb', 'Tb'];
        return(value/1024**(e = e <= 0 ? 0:e)).toFixed(digit)+' '+extensions[e];
      },
      parseMagnet(deselectAll = false) {
        const magnet = parseTorrent.decode(this.magnetLink);
        deselectAll ? magnet.so = '-' : magnet.so = this.selectedNode.map( file => file.index).join(',');
        return magnet;
      },
      toRgba(hex) {
        const r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);

        return `rgba(${r}, ${g}, ${b}, 0.9)`;
      },

      getMagnetFiles() {
        if(!this.magnetLink.startsWith('magnet:?')) return;

        this.clearFiles();

        this.searchLoading = true;

        axios.post(this.baseURL + '/magnet', {
          magnet: this.parseMagnet(true),
        })
        .then((res) => {
          this.directoryTree = res.data;
          console.log(this.directoryTree);
          this.showSnack("Torrent's information has been loaded ");
        })
        .catch((err)=> {
          console.error(err);
          this.showSnack(err, true);
        })
        .finally(() => this.searchLoading = false);
      },

      streamSelectedFiles() {
        this.downloading = true;
        this.showSnack('Downloading started');
        fetch(this.baseURL + `/magnet/stream/${this.selectedNode.map( file => file.index)}`)
            .then( res => {

              const fileStream = streamSaver.createWriteStream(`${this.directoryTree[0].name}.zip`, {
                size: this.getSelectedFilesTotalSize(),
              });
              const readableStream = res.body;

              // More optimized
              if (readableStream.pipeTo) {
                return readableStream.pipeTo(fileStream);
              }

              const writer = fileStream.getWriter();

              const reader = res.body.getReader();

              const pump = () => reader.read()
                  .then(res => res.done
                      ? writer.close()
                      : writer.write(res.value).then(pump));
              pump();
            })
            .catch( (err)=> this.showSnack(err, true))
            .finally(() => {
              this.downloading = false;
              this.deleteTorrent();
              this.showSnack('Download is done');
            });
      },

      getFolderSize(file, size = 0) {

        file.children.forEach( child => {
          if(child.children.length > 0) {
            size = this.getFolderSize(child, size)
          } else size += child.size;
        })
        return size;
      },

      getSelectedFilesTotalSize() {
        let size = 0;
        this.selectedNode.forEach( file => size += file.size);
        return size;
      },

      clearFiles(inServer = false) {
        this.clearLoading = true;
        this.selectedNode = [];
        this.torrentFiles = [];
        this.directoryTree = [];
        this.activeNode = [];

        if(!inServer) {
          this.clearLoading = false;
          return
        }

        this.deleteTorrent();
        this.showSnack('Torrent cleared and deleted');

      },
      async deleteTorrent() {
        await axios.delete(this.baseURL + '/magnet/delete')
        .then(()=>console.log('torrent deleted'))
        .catch((err) => {
          console.error(err);
          this.showSnack(err, true);
        })
        .finally(()=> {
          this.clearLoading = false;
          this.downloading = false;
          this.searchLoading = false;
        });
      },
      showSnack(message, err = false) {
        this.snackbar.text = message;
        this.snackbar.display = true;
        this.snackbar.isErr = err;
      }
    }
  }
</script>

<style lang="scss">
  .torrent {
    .v-data-table__selected {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }
    tbody {
      tr:hover {
        background-color: rgba(255, 255, 255, 0.05) !important;
      }
    }

    .fileFormat {
      width: 10vh;
      display: flex;
      justify-content: flex-start;
    }

    .treeScroll {
      max-height: 50vh;
      overflow: auto;
      scroll-behavior: smooth;
      //background-color: var(--v-dark2-lighten1);
      border-radius: 4px;
      box-shadow: inset 0 0 9px 0 rgb(0 0 0 / 50%);
      cursor: pointer;
    }

    .inputEllipsis {
      input {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-left: 0.5em;
      }
    }
  }
</style>
