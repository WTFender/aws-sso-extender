<!-- eslint-disable max-len -->
<template>
  <div
    v-if="!permissions.history"
  >
    <PrimeButton
      size="small"
      icon="pi pi-search"
      class="p-button-primary"
      label="Find Login Links"
      @click="requestHistory()"
    />
  </div>
  <div v-else-if="foundDirs">
    <p v-if="foundDirs.length === 0">
      No login links found in browser history.
    </p>
    <h2 v-else>
      Detected Login Links
    </h2>
    <div
      v-for="dir in foundDirs"
      :key="dir"
    >
      <PrimeButton
        class="p-button-primary"
        :label="dir"
        style="margin-top: 5px"
        @click="openLink(`https://${dir}.awsapps.com/start#/`)"
      />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'LoginLinks',
  data() {
    return {
      permissions: {
        origins: false,
        history: false,
      },
      foundDirs: [],
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
    openLink(link) {
      window.open(link, '_blank');
    },
    setDirectories(dirs) {
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
