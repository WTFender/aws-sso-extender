<!-- eslint-disable max-len -->
<!-- eslint-disable vue/v-on-event-hyphenation -->
<template>
  <div class="card">
    <ProfileTable
      v-if="page === 'favorites' || page === 'profiles'"
      :app-profiles="page === 'favorites' ? faveProfiles : appProfiles"
      :user="user"
      @updateProfile="updateProfile"
      @updateProfileLabel="updateProfileLabel"
    />
    <div v-if="page === 'settings'">
      <form>
        <PrimeButton
          class="p-button-danger"
          label="Reset Preferences"
          @click="resetCustom()"
        />
      </form>
    </div>
    <pre v-if="page === 'json' && config.debug">
      <br>
      {{ '\n'+dataJson }}
    </pre>
    <div class="footer" />
  </div>
  <i
    class="pi pi-list page-icon page-profiles"
    :class="page === 'profiles' ? 'page-active' : ''"
    @click="page = 'profiles'"
  />
  <i
    class="pi pi-star-fill page-icon page-favorites"
    :class="page === 'favorites' ? 'page-active' : ''"
    @click="page = 'favorites'"
  />
  <i
    class="pi pi-circle-fill status-icon"
    :class="'status-' + status.status"
    :alt="status.status"
  />
  <p class="status-text">
    {{ status.message }}
  </p>
  <i
    class="pi pi-wrench footer-icon"
    :class="'status-' + status.status"
    alt="Settings"
    @click="page = 'settings'"
  />
  <i
    class="pi pi-code footer-icon"
    :class="'status-' + status.status"
    alt="JSON Data"
    @click="page = 'json'"
  />
</template>
<script>
import extension from '../extension';

export default {
  name: 'PopupView',
  data() {
    return {
      config: {},
      dataJson: {},
      staleHours: 24,
      status: {
        message: '',
        status: 'unknown',
      },
      page: 'profiles', // profiles, favorites, settings
      custom: {},
      appProfiles: [],
      user: {},
      updatedAt: null,
    };
  },
  computed: {
    staleData() {
      // const limit = this.staleHours * 1000 * 60 * 60;
      if ((Date.now()) > this.updatedAt) {
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
    this.config = extension.config;
    extension.loadData().then((data) => {
      this.dataJson = JSON.stringify(data, null, 2);
      this.updatedAt = new Date(data.updatedAt);
      this.user = data.user;
      this.custom = data.custom;
      this.appProfiles = this.customizeProfiles(data.appProfiles);
      extension.log(this.custom);
      extension.log(this.user);
      extension.log(this.appProfiles);
      extension.log(this.updatedAt);
      if (this.staleData) {
        this.status = { status: 'stale', message: 'Login to AWS SSO to refresh profiles' };
      } else {
        this.status = { status: 'healthy', message: '' };
      }
    }).catch((error) => {
      this.status = { status: 'unhealthy', message: 'failed to load data' };
      throw error;
    });
  },
  methods: {
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
    resetCustom() {
      this.custom = {};
      extension.saveCustom(this.custom);
      extension.loadData().then((data) => {
        this.appProfiles = this.customizeProfiles(data.appProfiles);
      });
    },
    updateProfile(appProfile) {
      this.custom[appProfile.profile.id] = appProfile.profile.custom;
      extension.saveCustom(this.custom);
      extension.loadData().then((data) => {
        this.appProfiles = this.customizeProfiles(data.appProfiles);
      });
    },
    updateProfileLabel(event) {
      extension.log(event);
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
.card {
  width: 500px !important;
  display: inline-block;
  margin: 0px;
  padding: 0px;
  padding-bottom: 24px;
  border: none;
}
.page-icon {
  font-size: 2rem;
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
.page-profiles {
  left: 450px;
}
.page-favorites {
  left: 410px;
}
.footer {
  color: #343a40;
  border-top: 1px solid #dee2e6;
  background: #f8f9fa;
  position:fixed;
  bottom:0px;
  height: 25px;
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
.pi-wrench {
  position: fixed;
  left: 5px;
  bottom: 5px;
  left: 455px;
}
.footer-icon {
  color: #dee2e6;
}
.footer-icon:hover {
  color: #343a40;
  cursor: pointer;
}
</style>
