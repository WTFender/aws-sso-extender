<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<!-- eslint-disable prefer-destructuring -->
<!-- eslint-disable max-len -->
<!-- eslint-disable vue/v-on-event-hyphenation -->
<template>
  <!--- Setup -->
  <SetupSteps
    v-if="permissions.origins === false || loaded === false"
    :permissions="permissions"
    :loaded="loaded"
    @demo="demo()"
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

      <!--- User page -->
      <div
        v-if="page === 'user'"
        class="settings"
      >
        <h2>Users</h2>
        <Listbox
          v-model="user"
          :options="users"
          class="w-full md:w-14rem"
        >
          <template #option="slotProps">
            <div class="flex align-items-center">
              <div>
                {{ slotProps.option.subject + ' @ ' + slotProps.option.managedActiveDirectoryId }}
              </div>
            </div>
          </template>
        </Listbox>
        <br>
        <PrimeButton
          class="p-button-warning reset-button"
          label="Reset Preferences"
          style="margin-top: 15px"
          @click="resetUser()"
        />
        <h2>Default User</h2>
        <select
          id="defaultUserSelect"
          name="defaultUserSelect"
          @change="setDefaultUser($event)"
        >
          <option
            v-for="u in defaultUserOptions"
            :key="u.userId"
            :label="u.label"
            :value="u.userId"
            :selected="u.userId === settings.defaultUser"
          />
        </select>
        <div
          v-if="!demoMode"
          style="margin-top: 15px;"
        >
          <LoginLinks />
        </div>
      </div>

      <!--- Settings page -->
      <div
        v-if="page === 'settings'"
        class="settings"
      >
        <div>
          <PrimeButton
            class="p-button-danger reset-button"
            label="Reset All Data"
            @click="reset()"
          />
        </div>
        <br>
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
        class="pi pi-code debug-icon"
        :class="'status-' + status.status"
        alt="JSON Data"
        @click="setPage('json')"
      />
    </div>

    <!--- Menu Icons -->
    <i
      class="pi page-user page-icon"
      :class="{ 'page-active': page === 'user', 'pi-users': users.length > 1, 'pi-user': users.length >= 1 }"
      @click="setPage('user')"
    />
    <i
      class="pi pi-list page-icon page-profiles"
      :class="{ 'page-active': page === 'profiles' }"
      @click="setPage('profiles')"
    />
    <i
      v-if="faveProfiles.length > 0"
      class="pi pi-star-fill page-icon page-favorites"
      :class="{ 'page-active': page === 'favorites' }"
      @click="faveProfiles.length !== 0 ? setPage('favorites') : function(){}"
    />
  </div>

  <IamRoles
    :app-profiles="appProfiles"
    @updateProfile="updateProfile"
  />
</template>
<script lang="ts">
import demoData from '../demo.json';
import { AppData, ExtensionData, UserData } from '../types';

export default {
  name: 'PopupView',
  data() {
    return {
      raw: {},
      activeUserId: '',
      defaultUser: '',
      demoMode: false,
      permissions: {
        origins: false,
        history: false,
      },
      setupSteps: [
        { id: 'permissions', title: 'Required Permissions', ref: this.permissions },
        { id: 'login', title: 'Login to AWS SSO', ref: this.loaded },
      ],
      loaded: false,
      user: {
        custom: {},
      } as UserData,
      users: [] as UserData[],
      settings: {
        defaultUser: 'lastUserId',
        lastUserId: '',
      },
      appProfiles: [] as AppData[],
      dataJson: '',
      staleHours: 1,
      status: {
        message: '',
        status: 'unknown',
      },
      lastPage: 'profiles',
      page: 'profiles', // profiles, favorites, settings
      updatedAt: 0,
    };
  },
  computed: {
    /*
    defaultUserPlaceholder() {
      if (this.settings.defaultUser === 'lastUserId') {
        return 'Last sign-in activity';
      }
      const user = this.getUser(this.settings.defaultUser);
      return `${user.subject} @ ${user.managedActiveDirectoryId}`;
    },
    */
    defaultUserOptions() {
      let options = [{ userId: 'lastUserId', label: 'Last sign-in activity' }];
      options = options.concat(this.userOptions);
      return options;
    },
    userOptions() {
      const options = this.users.map((user: UserData) => ({
        ...user,
        label: `${user.subject} @ ${user.managedActiveDirectoryId}`,
      }));
      return options;
    },
    staleData() {
      const limit = this.staleHours * 1000 * 60 * 60;
      if ((Date.now() - limit) > this.updatedAt) {
        return true;
      }
      return false;
    },
    faveProfiles(): AppData[] {
      return this.userProfiles.filter((ap: AppData) => ap.profile.custom?.favorite === true);
    },
    userProfiles() {
      this.$ext.log(this.user);
      if (this.user === null) { return []; }
      // eslint-disable-next-line vue/max-len
      return this.appProfiles.filter((ap: AppData) => this.user.appProfileIds.includes(ap.profile.id));
    },
  },
  watch: {
    user() {
      this.$ext.log('user change');
      if (this.user === null) {
        this.setUser(this.getUser(this.activeUserId));
      } else {
        this.setUser(this.getUser(this.user.userId));
      }
      this.$ext.log(this.user);
      this.loaded = true;
    },
    loaded(v) {
      if (v === true) {
        if (this.faveProfiles.length > 0) {
          this.setPage('favorites');
        }
      }
    },
  },
  created() {
    this.$browser.permissions.onAdded.addListener(this.handlePermissions);
    // eslint-disable-next-line func-names
    this.$ext.checkPermissions().then((perms) => {
      this.permissions = perms;
    });
    this.reload();
  },
  methods: {
    demo() {
      this.$ext.log('demoMode');
      this.demoMode = true;
      this.loaded = true;
      this.permissions = {
        history: false,
        origins: false,
      };
      this.load(demoData);
    },
    getUser(userId: string) {
      const user = this.users.filter((u) => u.userId === userId)[0];
      return user;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setDefaultUser(userId: any) {
      if (userId.target instanceof Element) {
        this.settings.defaultUser = userId.target.value;
      } else {
        this.settings.defaultUser = userId;
      }
      if (!this.demoMode) {
        this.$ext.saveSettings(this.settings).then(() => {
          this.setUser(this.$ext.getDefaultUser(this.raw));
        });
      }
    },
    setUser(user: UserData) {
      this.user = user;
      this.settings.lastUserId = this.user.userId;
      this.activeUserId = this.user.userId;
      if (!this.demoMode) {
        this.$ext.saveSettings(this.settings);
      }
      this.$ext.log(this.user);
    },
    load(data: ExtensionData) {
      this.raw = data;
      this.dataJson = JSON.stringify(data, null, 2);
      this.settings = data.settings;
      this.users = data.users;
      if (this.users.length > 0) {
        this.updatedAt = data.updatedAt as number;
        this.setUser(this.$ext.getDefaultUser(data));
        this.appProfiles = data.appProfiles;
        // handled in Extension class
        // this.appProfiles = this.customizeProfiles(data.appProfiles);
        /* not in use yet
        if (this.staleData) {
          this.status = { status: 'stale', message: 'Login to AWS SSO to refresh profiles' };
        } else {
          this.status = { status: 'healthy', message: '' };
        }
        if (Object.keys(this.user).length > 1) {
          // if only 1 key (e.g. updatedAt), no data is loaded
          this.loaded = true;
        }
        */
      }
    },
    reload() {
      if (this.demoMode) {
        this.settings = demoData.settings;
        this.users = demoData.users;
        this.appProfiles = demoData.appProfiles;
        if (this.user.userId !== 'demoUserId1') {
          // eslint-disable-next-line prefer-destructuring
          this.user = demoData.users[0];
        }
      } else {
        this.$ext.loadData().then((data) => {
          this.load(data);
        }).catch((error) => {
          this.status = { status: 'unhealthy', message: 'failed to load data' };
          throw error;
        });
      }
    },
    handlePermissions() {
      this.$ext.checkPermissions().then((perms) => {
        this.permissions = perms;
      });
    },
    setPage(page) {
      this.lastPage = this.page;
      this.page = page;
    },
    reset() {
      this.appProfiles = [];
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
      this.$ext.log(this.user);
      this.$ext.log(appProfile);
      this.user.custom[appProfile.profile.id] = appProfile.profile.custom;
      if (this.faveProfiles.length === 0) {
        this.setPage('profiles');
      }
      if ((!this.demoMode) && this.user.userId !== 'demoUserId1') {
        this.$ext.saveUser(this.user);
      }
      this.reload();
    },
    updateProfileLabel(event) {
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
  top: 20px;
}

.page-active {
  color: #343a40;
}

.page-icon:hover {
  color: #343a40;
  cursor: pointer;
}

.page-icon.disabled:hover {
  color: #dee2e6;
  cursor: inherit;
}

.page-user {
  left: 370px;
}

.page-favorites {
  left: 450px;
}

.page-profiles {
  left: 410px;
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

.debug-icon {
  position: fixed;
  left: 5px;
  bottom: 5px;
  left: 430px;
}

.debug-icon {
  color: #dee2e6;
}

.debug-icon:hover {
  color: #343a40;
  cursor: pointer;
}

.json,
.settings {
  margin: 15px;
  padding: 15px;
}
</style>
