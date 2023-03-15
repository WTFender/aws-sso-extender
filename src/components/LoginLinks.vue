<!-- eslint-disable max-len -->
<template>
  <div
    v-if="!permissions"
  >
    <PrimeButton
      size="small"
      class="p-button-primary"
      label="Find Login Links"
      @click="requestHistory()"
    />
  </div>
  <div v-else-if="foundDirs">
    <h3>Login Links</h3>
    <div
      v-for="dir in foundDirs"
      :key="dir"
    >
      <a
        target="_blank"
        :href="`https://${dir}.awsapps.com/start#/`"
      >{{ `https://${dir}.awsapps.com/start#/` }}</a>
    </div>
    <p v-if="foundDirs.length === 0">
      No login links found in browser history.
    </p>
  </div>
</template>

<script>
import extension from '../extension';

export default {
  name: 'LoginLinks',
  props: {
    permissions: {
      type: Object,
      default() {
        return { origins: false, history: false };
      },
    },
  },
  data() {
    return {
      foundDirs: null,
    };
  },
  created() {
    extension.log(this.permissions);
    if (this.permissions) {
      extension.log('PERMS');
      extension.findDirectories(this.setDirectories);
    } else {
      extension.log('NOOOOOPERMS');
    }
  },
  methods: {
    setDirectories(dirs) {
      extension.log('dirs');
      extension.log(dirs);
      this.foundDirs = dirs;
    },
    requestHistory() {
      extension.requestPermsHistory();
      extension.close();
    },
  },
};
</script>

<style lang="scss" scoped>
</style>
