<!-- eslint-disable max-len -->
<!-- eslint-disable vue/v-on-event-hyphenation -->
<template>
  <!--- Setup -->
  <div
    v-if="permissions === false || loaded === false"
    class="card"
    style="padding-left: 20px;"
  >
    <h2>
      <img
        alt="AWS SSO Extender"
        src="icons/128.png"
        width="25"
        style="vertical-align:middle;"
      >
      Setup
    </h2>
    <Accordion
      style="padding-right: 20px; padding-bottom: 20px;"
    >
      <AccordionTab
        :disabled="permissions.origins"
      >
        <template #header>
          <div style="width: 90%">
            <span style="margin-left: 5px;">Required Permissions</span>
          </div>
          <div style="width: 10%">
            <i
              class="pi"
              :class="permissions.origins === true ? 'pi-check-circle' : 'pi-exclamation-circle'"
              :style="permissions.origins === true ? 'color: green;' : 'color: orange;'"
            />
          </div>
        </template>
        <p>This extension requires access to awsapps.com.</p>
        <PrimeButton
          size="small"
          class="p-button-success"
          label="Request Permissions"
          @click="requestPermissions()"
        />
        <!--- TODO add granular site perms options --->
        <PrimeButton
          style="margin-left: 20px; display: none;"
          size="small"
          class="p-button-warning"
          label="Advanced"
          @click="requestPermissions()"
        />
      </AccordionTab>

      <AccordionTab
        :disabled="loaded"
      >
        <template #header>
          <div style="width: 90%">
            <span style="margin-left: 5px;">Login to AWS SSO</span>
          </div>
          <div style="width: 10%">
            <i
              class="pi"
              :class="loaded === true ? 'pi-check-circle' : 'pi-exclamation-circle'"
              :style="loaded === true ? 'color: green;' : 'color: orange;'"
            />
          </div>
        </template>
        <p>Login to AWS SSO to populate your profiles. Your login link typically looks like this:</p>
        <pre>
companyName.awsapps.com/start#/
directoryId.awsapps.com/start#/
        </pre>
        <Divider
          v-if="!permissions.history"
          align="left"
          type="solid"
        >
          <small>Optional</small>
        </Divider>
        <LoginLinks
          :permissions="permissions"
        />
      </AccordionTab>
    </Accordion>
  </div>

  <!--- Post-setup -->
  <div v-else>
    <div class="card">
      <!--- Profiles/Favorites page -->
      <ProfileTable
        v-if="page === 'favorites' || page === 'profiles'"
        :app-profiles="page === 'favorites' ? faveProfiles : appProfiles"
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
            @click="resetCustom()"
          />
          <PrimeButton
            class="p-button-danger reset-button"
            label="Reset All Data"
            @click="reset()"
          />
        </div>
        <br>
        <div>
          <LoginLinks
            :permissions="permissions"
          />
        </div>
      </div>

      <!--- Debug JSON page -->
      <pre
        v-if="page === 'json' && config.debug"
        class="json"
      >
        {{ '\n'+dataJson }}
      </pre>

      <!--- Footer -->
      <div class="footer" />

      <!--- Debug -->
      <i
        v-if="config.debug"
        class="pi pi-circle-fill status-icon"
        :class="'status-' + status.status"
        :alt="status.status"
      />
      <i
        v-if="config.debug"
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
      permissions: {},
      setupSteps: [
        { id: 'permissions', title: 'Required Permissions', ref: this.permissions },
        { id: 'login', title: 'Login to AWS SSO', ref: this.loaded },
      ],
      loaded: false,
      config: {},
      dataJson: {},
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
    staleData() {
      const limit = this.staleHours * 1000 * 60 * 60;
      if ((Date.now() - limit) > this.updatedAt) {
        return true;
      }
      return false;
    },
    faveProfiles() {
      const faveProfiles = [];
      this.appProfiles.forEach((ap) => {
        if (ap.profile.custom.favorite) {
          faveProfiles.push(ap);
        }
      });
      return faveProfiles;
    },
  },
  created() {
    this.config = this.$ext.config;
    this.permissions = {
      origins: false,
      history: false,
    };
    // eslint-disable-next-line func-names
    this.$ext.checkPermissions().then((perms) => {
      this.permissions = perms;
    });
    this.$ext.loadData().then((data) => {
      this.dataJson = JSON.stringify(data, null, 2);
      this.updatedAt = new Date(data.updatedAt);
      this.user = data.user;
      this.custom = data.custom;
      this.appProfiles = this.customizeProfiles(data.appProfiles);
      if (this.faveProfiles.length > 0) { this.setPage('favorites'); }
      if (this.staleData) {
        this.status = { status: 'stale', message: 'Login to AWS SSO to refresh profiles' };
      } else {
        this.status = { status: 'healthy', message: '' };
      }
      if (Object.keys(this.user).length > 1) {
        // if only 1 key (e.g. updatedAt), no data is loaded
        this.loaded = true;
      }
    }).catch((error) => {
      this.status = { status: 'unhealthy', message: 'failed to load data' };
      throw error;
    });
  },
  methods: {
    requestPermissions() {
      this.$ext.requestOrigins();
      window.close();
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
        profile.profile.custom = ap.profile.id in this.custom ? this.custom[ap.profile.id] : defaults;
        customProfiles.push(profile);
      });
      return customProfiles;
    },
    reset() {
      this.custom = {};
      this.appProfiles = [];
      this.user = {};
      this.$ext.resetData();
      this.$browser.permissions.remove({
        permissions: ['history'],
      });
      this.$browser.permissions.remove({
        origins: this.config.origins,
      });
      window.close();
    },
    resetCustom() {
      this.custom = {};
      this.$ext.saveCustom(this.custom);
      this.$ext.loadData().then((data) => {
        this.appProfiles = this.customizeProfiles(data.appProfiles);
      });
      this.setPage('profiles');
    },
    updateProfile(appProfile) {
      this.custom[appProfile.profile.id] = appProfile.profile.custom;
      this.$ext.saveCustom(this.custom);
      this.$ext.loadData().then((data) => {
        this.appProfiles = this.customizeProfiles(data.appProfiles);
      });
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
.page-icon:hover{
  color: #343a40;
  cursor: pointer;
}
.page-back {
  left: 450px;
}
.page-profiles {
  left: 450px;
}
.page-favorites {
  left: 410px;
}
.page-settings {
  left: 370px;
}
.footer {
  color: #343a40;
  border-top: 1px solid #dee2e6;
  background: #f8f9fa;
  position:fixed;
  bottom:0px;
  height: 5px;
  left:0px;
  right:0px;
  overflow:hidden;
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
.json, .settings {
  margin: 15px;
  padding: 15px;
}
</style>
