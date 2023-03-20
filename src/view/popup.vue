<!-- eslint-disable max-len -->
<!-- eslint-disable vue/v-on-event-hyphenation -->
<template>
  <!--- Setup -->
  <SetupSteps
    v-if="permissions === false || loaded === false"
    :permissions="permissions"
    :loaded="loaded"
    @skipSetup="skipSetup()"
    @demoMode="demoMode()"
  />

  <!--- Post-setup -->
  <div v-else>
    <div class="card">
      <!--- Profiles/Favorites page -->
      <ProfileTable
        v-if="page === 'favorites' || page === 'profiles'"
        :app-profiles="page === 'favorites' ? faveProfiles : userProfiles"
        :user="user"
        @updateProfile="updateProfile"
        @updateProfileLabel="updateProfileLabel"
      />

      <!--- Settings page -->
      <div
        v-if="page === 'settings'"
        class="settings"
      >
        <div>
          <PrimeButton
            class="p-button-warning reset-button"
            label="Reset Preferences"
            style="margin-right: 15px"
            @click="resetUser()"
          />
          <PrimeButton
            class="p-button-danger reset-button"
            label="Reset All Data"
            @click="reset()"
          />
        </div>
        <br>
        <div>
          <LoginLinks :permissions="permissions" />
        </div>
      </div>

      <!--- Debug JSON page -->
      <pre
        v-if="page === 'json' && $ext.config.debug"
        class="json"
      >
          {{ '\n' + dataJson }}
        </pre>

      <!--- Footer -->
      <div class="footer" />

      <!--- Debug -->
      <i
        v-if="$ext.config.debug"
        class="pi pi-circle-fill status-icon"
        :class="'status-' + status.status"
        :alt="status.status"
      />
      <i
        v-if="$ext.config.debug"
        class="pi pi-code footer-icon"
        :class="'status-' + status.status"
        alt="JSON Data"
        @click="setPage('json')"
      />
    </div>

    <!--- Menu Icons -->
    <i
      v-if="page === 'settings'"
      class="pi pi-chevron-right page-icon page-back"
      @click="setPage('profiles')"
    />
    <i
      v-if="page !== 'settings'"
      class="pi switch-user page-icon"
      :class="data.data.users.length > 1 ? 'pi-users': 'pi-user'"
      @click="switchUser($event)"
    />
    <OverlayPanel ref="op">
      <h3>Default User</h3>
      <Dropdown
        v-model="defaultUser"
        :options="userOptions"
        option-label="label"
        :placeholder="defaultUserPlaceholder"
        class="w-full md:w-14rem"
      />
      <h3>Switch User</h3>
      <div
        v-for="u in data.data.users"
        :key="u.userId"
        style="padding-bottom: 5px;"
      >
        <PrimeButton
          :disabled="u.userId === user.userId"
          :class="u.userId === user.userId ? 'p-button-primary' : 'p-button-secondary'"
          :label="u.subject +' @ '+u.managedActiveDirectoryId"
          @click="user = u"
        />
        <br>
      </div>
    </OverlayPanel>
    <i
      v-if="page !== 'settings'"
      class="pi pi-list page-icon page-profiles"
      :class="page === 'profiles' ? 'page-active' : ''"
      @click="setPage('profiles')"
    />
    <i
      v-if="page !== 'settings'"
      class="pi pi-star-fill page-icon page-favorites"
      :class="page === 'favorites' ? 'page-active' : ''"
      @click="setPage('favorites')"
    />
    <i
      v-if="page !== 'settings'"
      class="pi pi-cog page-icon page-settings"
      @click="setPage('settings')"
    />
  </div>
</template>
<script>
export default {
  name: 'PopupView',
  data() {
    return {
      defaultUser: 'lastUserId',
      permissions: {},
      setupSteps: [
        { id: 'permissions', title: 'Required Permissions', ref: this.permissions },
        { id: 'login', title: 'Login to AWS SSO', ref: this.loaded },
      ],
      loaded: false,
      data: {},
      dataJson: '',
      staleHours: 1,
      status: {
        message: '',
        status: 'unknown',
      },
      lastPage: 'profiles',
      page: 'profiles', // profiles, favorites, settings
      custom: {},
      appProfiles: [],
      user: {},
      updatedAt: null,
    };
  },
  computed: {
    defaultUserPlaceholder() {
      if (this.data.data.settings.defaultUser === 'lastUserId') {
        return 'Last sign-in activity';
      }
      const user = this.getUser(this.data.data.settings.defaultUser);
      return `${user.subject} @ ${user.managedActiveDirectoryId}`;
    },
    userOptions() {
      let options = [{ userId: 'lastUserId', label: 'Last sign-in activity' }];
      options = options.concat(
        this.data.data.users.map((user) => ({
          ...user,
          label: `${user.subject} @ ${user.managedActiveDirectoryId}`,
        })),
      );
      return options;
    },
    staleData() {
      const limit = this.staleHours * 1000 * 60 * 60;
      if ((Date.now() - limit) > this.updatedAt) {
        return true;
      }
      return false;
    },
    faveProfiles() {
      return this.userProfiles.filter((ap) => ap.profile.custom.favorite);
    },
    userProfiles() {
      // eslint-disable-next-line max-len
      return this.appProfiles.filter((ap) => this.user.appProfileIds.includes(ap.profile.id));
    },
  },
  watch: {
    loaded(v) {
      if (v === true) {
        if (this.faveProfiles.length > 0) {
          this.setPage('favorites');
        }
      }
    },
    defaultUser(user) {
      this.data.data.settings.defaultUser = user.userId;
      this.$ext.saveSettings(this.data.data.settings);
    },
  },
  created() {
    this.permissions = {
      origins: false,
      history: false,
    };
    this.$browser.permissions.onAdded.addListener(this.handlePermissions);
    // eslint-disable-next-line func-names
    this.$ext.checkPermissions().then((perms) => {
      this.permissions = perms;
    });
    this.reload();
  },
  methods: {
    demoMode() {
      const demoData = {
        users: [
          {
            userId: 'demoUserId',
            subject: 'demoUser',
            managedActiveDirectoryId: 'd-demoDirectoryId',
            preferredUsername: 'demoUser',
            accountId: 'demoAccountId',
            appProfileIds: [
              'p-demoProfileId',
            ],
            custom: {},
          }],
        appProfiles: [{
          id: 'ins-demoAppId',
          name: 'demoAppName',
          description: 'Demo Application',
          profile: {
            id: 'p-demoProfileId',
            name: 'demoProfileName',
          },
        }],
        settings: {
          defaultUser: 'lastUserId',
          lastUserId: null,
        },
      };
      this.data.data = demoData;
      // eslint-disable-next-line prefer-destructuring
      this.user = demoData.users[0];
      this.appProfiles = demoData.appProfiles;
      this.skipSetup();
    },
    skipSetup() {
      this.loaded = true;
      this.permissions = {
        history: false,
        origins: false,
      };
    },
    getUser(userId) {
      const user = this.data.data.users.filter((u) => u.userId === userId)[0];
      return user;
    },
    setUser(userId = null) {
      if (userId !== null) {
        this.data.data.settings.defaultUser = userId;
      }
      if (this.data.data.settings.defaultUser === 'lastUserId') {
        // most recent updatedAt
        this.data.data.users.sort((a, b) => ((a.updatedAt > b.updatedAt) ? -1 : 1));
        // eslint-disable-next-line prefer-destructuring
        this.user = this.data.data.users[0];
      } else {
        // find lastUserId in users
        this.user = this.getUser(this.data.data.settings.defaultUser);
      }
      this.data.data.settings.lastUserId = this.user.userId;
      this.$ext.saveSettings(this.data.data.settings);
    },
    reload() {
      this.$ext.loadData().then((data) => {
        this.data.data = data;
        this.dataJson = JSON.stringify(data, null, 2);
        if (data.users.length > 0) {
          this.updatedAt = new Date(data.updatedAt);
          this.setUser();
          // eslint-disable-next-line prefer-destructuring
          this.appProfiles = this.customizeProfiles(data.appProfiles);
          if (this.staleData) {
            this.status = { status: 'stale', message: 'Login to AWS SSO to refresh profiles' };
          } else {
            this.status = { status: 'healthy', message: '' };
          }
          if (Object.keys(this.user).length > 1) {
            // if only 1 key (e.g. updatedAt), no data is loaded
            this.loaded = true;
          }
        }
      }).catch((error) => {
        this.status = { status: 'unhealthy', message: 'failed to load data' };
        throw error;
      });
    },
    switchUser(e) {
      this.$refs.op.toggle(e);
    },
    handlePermissions(permissions) {
      this.$ext.log(permissions);
      if (permissions.permissions.includes('history')) {
        this.$ext.log(permissions);
        this.permissions.history = true;
      }
      permissions.origins.forEach((origin) => {
        if (this.$ext.config.origins.includes(origin)) {
          this.permissions.origins = true;
        }
      });
    },
    setPage(page) {
      this.lastPage = this.page;
      this.page = page;
    },
    customizeProfiles(appProfiles) {
      const defaults = {
        favorite: false,
        label: null,
      };
      const customProfiles = [];
      appProfiles.forEach((ap) => {
        const profile = { ...ap };
        // eslint-disable-next-line max-len
        profile.profile.custom = ap.profile.id in this.user.custom ? this.user.custom[ap.profile.id] : defaults;
        customProfiles.push(profile);
      });
      return customProfiles;
    },
    reset() {
      this.appProfiles = [];
      this.user = {};
      this.$ext.resetData();
      this.$browser.permissions.remove({
        permissions: ['history'],
      });
      this.$browser.permissions.remove({
        origins: this.$ext.config.origins,
      });
      window.close();
    },
    resetUser() {
      this.user.custom = {};
      this.$ext.saveUser(this.user);
      this.setPage('profiles');
      this.reload();
    },
    updateProfile(appProfile) {
      this.user.custom[appProfile.profile.id] = appProfile.profile.custom;
      this.$ext.saveUser(this.user);
      this.reload();
    },
    updateProfileLabel(event) {
      this.$ext.log(event);
      const { newData } = event;
      if ('profile.custom.label' in newData) {
        newData.profile.custom.label = newData['profile.custom.label'];
        this.updateProfile(newData);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.p-rowgroup-footer td {
  font-weight: 700;
}

::v-deep(.p-rowgroup-header) {
  span {
    font-weight: 700;
  }

  .p-row-toggler {
    vertical-align: middle;
    margin-right: .25rem;
  }
}

.setup-done {
  color: green;
}

.setup-pending {
  color: orange;
}

.card {
  width: 500px !important;
  display: inline-block;
  margin: 0px;
  padding: 0px;
  border: none;
}

.page-icon {
  font-size: 1.75rem;
  color: #dee2e6;
  position: absolute;
  top: 15px;
}

.page-active {
  color: #343a40;
}

.page-icon:hover {
  color: #343a40;
  cursor: pointer;
}

.page-back {
  left: 450px;
}

.switch-user {
  left: 330px;
}

.page-settings {
  left: 370px;
}

.page-favorites {
  left: 410px;
}

.page-profiles {
  left: 450px;
}

.footer {
  color: #343a40;
  border-top: 1px solid #dee2e6;
  background: #f8f9fa;
  position: fixed;
  bottom: 0px;
  height: 5px;
  left: 0px;
  right: 0px;
  overflow: hidden;
  text-align: center;
}

.status-icon {
  position: fixed;
  left: 5px;
  bottom: 5px;
}

.status-icon.status-unknown {
  color: #dee2e6;
}

.status-icon.status-unhealthy {
  color: #eb6060;
}

.status-icon.status-stale {
  color: #f7e463;
}

.status-icon.status-healthy {
  color: #7cd992;
}

.status-text {
  position: fixed;
  left: 25px;
  bottom: 5px;
  padding: 0px;
  margin: 0px;
}

.pi-code {
  position: fixed;
  left: 5px;
  bottom: 5px;
  left: 430px;
}

.footer-icon {
  color: #dee2e6;
}

.footer-icon:hover {
  color: #343a40;
  cursor: pointer;
}

.json,
.settings {
  margin: 15px;
  padding: 15px;
}
</style>
