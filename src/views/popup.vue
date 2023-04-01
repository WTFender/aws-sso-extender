<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<!-- eslint-disable prefer-destructuring -->
<!-- eslint-disable max-len -->
<!-- eslint-disable vue/v-on-event-hyphenation -->
<template>
  <!--- Setup -->
  <SetupSteps v-if="permissions.origins === false || loaded === false" :permissions="permissions" :loaded="loaded"
    @demo="demo()" />

  <!--- Post-setup -->
  <div v-else>
    <div class="card">
      <!--- Profiles/Favorites page -->
      <ProfileTable v-if="page === 'favorites' || page === 'profiles'"
        :app-profiles="page === 'favorites' ? faveProfiles : userProfiles" :user="user" @updateProfile="updateProfile"
        @updateProfileLabel="updateProfileLabel" />

      <!--- User page -->
      <div v-if="page === 'users'" class="settings">
        <TabView>
          <TabPanel header="Users">
            <h3>Current User</h3>
            <PListbox v-model="user" name="userSelect" :options="users" class="w-full md:w-14rem"
              style="margin-bottom: 5px">
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <div>
                    {{ slotProps.option.subject + ' @ ' + slotProps.option.managedActiveDirectoryId }}
                  </div>
                </div>
              </template>
            </PListbox>
            <h3>Default User</h3>
            <select id="defaultUserSelect" name="defaultUserSelect" @change="setDefaultUser($event.target.value)">
              <option v-for="u in defaultUserOptions" :key="u.userId" :label="u.label" :value="u.userId"
                :selected="u.userId === settings.defaultUser" />
            </select>
            <br><br>
            <PrimeButton class="p-button-warning reset-button" label="Reset Preferences" style="margin-top: 15px"
              @click="resetUser()" />
          </TabPanel>
          <TabPanel header="IAM Roles">
            <IamRoles :app-profiles="userProfiles" @updateProfiles="updateProfiles" @updateProfile="updateProfile" @setPage="setPage" />
          </TabPanel>
          <TabPanel header="Directories" v-if="false">
            <LoginLinks :permissions="permissions" />
          </TabPanel>
          <TabPanel header="Debug" v-if="$ext.config.debug">
            <pre>{{ dataJson }}</pre>
          </TabPanel>
        </TabView>
      </div>

      <!--- Settings page -->
      <div v-if="page === 'settings'" class="settings">
        <div>
          <PrimeButton class="p-button-danger reset-button" label="Reset All Data" @click="reset()" />
        </div>
        <br>
      </div>

      <!--- Footer -->
      <div class="footer" />
    </div>

    <!--- Menu Icons -->
    <i class="pi page-user page-icon"
      :class="{ 'page-active': page === 'users', 'pi-users': users.length > 1, 'pi-user': users.length >= 1 }"
      @click="setPage('users')" />
    <i class="pi pi-list page-icon page-profiles" :class="{ 'page-active': page === 'profiles' }"
      @click="setPage('profiles')" />
    <i v-if="faveProfiles.length > 0" class="pi pi-star-fill page-icon page-favorites"
      :class="{ 'page-active': page === 'favorites' }"
      @click="faveProfiles.length !== 0 ? setPage('favorites') : function () { }" />
  </div>
</template>
<script lang="ts">
import demoData from '../demo';
import { AppData, CustomData, ExtensionData, UserData } from '../types';

export default {
  name: 'PopupView',
  data() {
    return {
      raw: {} as ExtensionData,
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
      this.settings.lastUserId = this.user.userId;
      if (!this.demoMode) { this.$ext.saveSettings(this.settings) };
      this.reload();
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
    refreshProfiles(){
      this.appProfiles = [];
      this.appProfiles = this.$ext.customizeProfiles(this.user, this.raw.appProfiles);
    },
    demo() {
      this.$ext.log('demoMode');
      this.demoMode = true;
      this.permissions = {
        history: false,
        origins: true,
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
        this.$ext.saveSettings(this.settings);
      }
    },
    load(data: ExtensionData) {
      this.raw = data;
      this.dataJson = JSON.stringify(data, null, 2);
      this.settings = data.settings;
      this.users = data.users;
      if (this.users.length > 0) {
        this.updatedAt = data.updatedAt as number;
        if (!this.loaded || !this.user) {
          this.user = this.$ext.getDefaultUser(data);
        } else {
          this.user = data.users.filter((u) => u.userId === this.user.userId)[0]
        }
        this.refreshProfiles()
        this.loaded = true;
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
      this.$ext.saveUser(this.user).then(() => {
        this.setPage('profiles');
        this.reload();
      });
    },
    updateProfiles(appProfiles: AppData[]) {
      this.$ext.log('updateProfiles');
      appProfiles.forEach(ap => {
        this.user.custom[ap.profile.id] = ap.profile.custom as CustomData;
      });
      this.saveUser();
    },
    updateProfile(appProfile: AppData) {
      this.$ext.log('updateProfile');
      this.user.custom[appProfile.profile.id] = appProfile.profile.custom as CustomData;
      this.$ext.log(this.user);
      if (this.faveProfiles.length === 0) {
        this.setPage('profiles');
      }
      this.saveUser();
    },
    saveUser(){
      if ((!this.demoMode) && this.user.userId !== 'demoUserId1') {
        this.$ext.saveUser(this.user).then(() => {
          this.reload();
        })
      }
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
