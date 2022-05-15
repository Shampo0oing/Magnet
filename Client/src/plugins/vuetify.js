import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
        options: {
            customProperties: true
        },
        dark: true,
        themes: {
            dark: {
                dark: '#17172e',
                dark2: '#11112a',
                dark3: '#25254b',
                primary: '#F5DF66',
                secondary: '#c83939',
            }
        }
    }
});
