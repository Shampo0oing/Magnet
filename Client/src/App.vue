<template>
  <v-app style="font-family: 'Montserrat'">
    <v-app-bar app color="dark2" >
      <a class="flex d-inline-flex gap-1" href="." style="max-width: 200px; cursor: pointer">
        <img src="@/assets/magnet.svg"
               class="mt-6"
             style="max-width: 200px"
        >
      </a>

      <v-spacer></v-spacer>

      <v-btn href="https://webtor.io/" target="_blank" text color="primary">Webtor.io</v-btn>

      <v-menu offset-y open-on-hover transition="slide-y-transition" return-value="open">
        <template v-slot:activator="{ on, attrs, value}">
          <v-btn color="primary" text v-bind="attrs" v-on="on"> Webtorrent
            <v-icon>{{value ? 'mdi-chevron-up' : 'mdi-chevron-down'}}</v-icon>
          </v-btn>
        </template>
        <v-list class="d-flex flex-column" color="dark2">
          <v-btn href="https://webtorrent.io/docs" target="_blank" text color="primary">Documentation</v-btn>
          <v-btn href="https://webtorrent.io/free-torrents" target="_blank" text color="primary">Legal content</v-btn>
        </v-list>
      </v-menu>

      <v-menu offset-y open-on-hover transition="slide-y-transition">
        <template v-slot:activator="{ on, attrs, value}">
          <v-btn color="primary" text v-bind="attrs" v-on="on"> Thepiratebay
            <v-icon>{{value ? 'mdi-chevron-up' : 'mdi-chevron-down'}}</v-icon>
          </v-btn>
        </template>
        <v-list class="d-flex flex-column" color="dark2">
          <v-btn href="https://thepiratebay.org/search.php?q=category:603" target="_blank" text color="primary">Wallpaper</v-btn>
          <v-btn href="https://thepiratebay.org/search.php?q=category:601" target="_blank" text color="primary">E-Book</v-btn>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main class="main-bg">
      <HelloWorld/>
    </v-main>
  </v-app>
</template>

<script>
import HelloWorld from './components/HelloWorld';

export default {
  name: 'App',

  components: {
    HelloWorld,
  },

  data: () => ({
    //
  }),
  methods: {
    consoleLog(msg) {
      console.log(msg);
    },
    goHome() {
      window.open(document.URL, "_self");
    }
  }
};
</script>
