<!-- eslint-disable max-len -->
<template>
  <div
    v-if="!permissions.history"
  >
    <PrimeButton
      size="small"
      class="p-button-primary"
      label="Find Login Links"
      @click="requestHistory()"
    />
  </div>
  <div v-else-if="foundDirs">
    <h3>Detected Login Links</h3>
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
export default {
  name: 'LoginLinks',
  data() {
    return {
      permissions: {},
      foundDirs: null,
    };
  },
  created() {
    this.$ext.checkPermissions().then((perms) => {
      this.permissions = perms;
      if (perms.history) {
        this.$ext.searchHistory().then((dirs) => {
          this.setDirectories(dirs);
        });
      }
    });
  },
  methods: {
    setDirectories(dirs) {
      this.$ext.log('dirs');
      this.foundDirs = dirs;
    },
    requestHistory() {
      this.$browser.permissions.request({ permissions: ['history'] });
      window.close();
    },
  },
};
</script>

<style lang="scss" scoped>
</style>
