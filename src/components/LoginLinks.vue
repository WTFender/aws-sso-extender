<!-- eslint-disable max-len -->
<template>
  <div v-if="!permissions.history">
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
  name: "LoginLinks",
  data() {
    return {
      permissions: {
        history: false,
      },
      foundDirs: [],
    };
  },
  created() {
    this.$ext.checkPermissions().then((perms) => {
      this.permissions = perms;
      if (perms.history) {
        this.searchHistory().then((dirs) => {
          this.setDirectories(dirs);
        });
      }
    });
  },
  methods: {
    async searchHistory(): Promise<string[]> {
      const dirs: string[] = [];
      return this.$ext.config.browser.history
        .search({
          text: "awsapps.com/start#/",
          startTime: Date.now() - 1000 * 60 * 60 * 24 * 30, // 1 month ago,
          maxResults: 1000,
        })
        .then((results) => {
          results?.forEach((site) => {
            const match = this.$ext.ssoUrlRegex.exec(site.url as string);
            if (match?.groups != null) {
              if (!(match.groups.directoryId in dirs)) {
                dirs.push(match.groups.directoryId);
              }
            }
          });
          const uniqDirs = [...new Set(dirs)];
          this.$ext.log(uniqDirs);
          return uniqDirs;
        });
    },
    openLink(link) {
      window.open(link, "_blank");
    },
    setDirectories(dirs) {
      this.foundDirs = dirs;
    },
    requestHistory() {
      this.$ext.config.browser.permissions.request({
        permissions: ["history"],
      });
      window.close();
    },
  },
};
</script>
