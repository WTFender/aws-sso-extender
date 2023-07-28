<!-- eslint-disable max-len -->
<template>
  <div v-sortable="{ disabled: false, options: { animation: 250, easing: 'cubic-bezier(1, 0, 0, 1)' } }" @ready="onReady" @end="onOrderChange">
    <div>a</div>
    <div>b</div>
    <div>c</div>
  </div>
</template>

<script lang="ts">
import {
  AppData, ExtensionSettings, IamRole, UserData,
} from '../types';
import { getFontColor, waitForElement } from '../utils';

export default {
  name: 'ProfileTable',
  props: {
    activeProfile: {
      // suppress ts errors, unsure why this is required
      required: false,
      default: () => ({} as AppData),
    },
    permissions: {
      type: Object,
      required: true,
    },
    filterProfiles: {
      type: Object,
      required: true,
    },
    user: {
      required: true,
      type: Object,
      default: () => ({} as UserData),
    },
    appProfiles: {
      type: Array,
      required: true,
    },
    settings: {
      required: true,
      type: Object,
      default: () => ({} as ExtensionSettings),
    },
    demoMode: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['updateProfile', 'requestPermissions'],
  data() {
    return {
      // eslint-disable-next-line vue/no-dupe-keys
      activeProfile: {} as AppData,
      colorPickerVisible: false,
      editorVisible: false,
      searchableFields: [
        'id',
        'applicationId',
        'description',
        'profile.custom.label',
        'profile.id',
        'profile.description',
        'profile.protocol',
      ],
      selectedProfile: null,
      sourceProfile: {} as AppData,
    };
  },
  computed: {
    consoleStyle() {
      return {
        'background-color': `#${this.activeProfile.profile.custom!.color}`,
        color: getFontColor(this.activeProfile.profile.custom!.color),
      };
    },
    consolePreview() {
      return this.$ext.buildLabel(
        this.user.custom.sessionLabelSso,
        this.user.subject,
        this.activeProfile.profile.custom!.label || this.activeProfile.profile.name,
        null,
        this.activeProfile.searchMetadata!.AccountId,
        this.activeProfile.searchMetadata!.AccountName,
      );
    },
    filterProfilesComputed() {
      return this.filterProfiles;
    },
  },
  methods: {
    onReady(event) {
      console.log(event.sortable);
    },

    onOrderChange(event) {
      console.log(event.oldIndex);
      console.log(event.newIndex);
    },
    requestPermissions() {
      this.$emit('requestPermissions');
    },
    editProfile(profile) {
      // duplicate profile without references
      // eslint-disable-next-line vue/no-mutating-props
      this.activeProfile = JSON.parse(JSON.stringify(profile));
      this.sourceProfile = JSON.parse(JSON.stringify(profile));
      this.editorVisible = true;
      waitForElement('#profileLabel').then((profileLabel) => {
        profileLabel.focus();
      });
    },
    saveActiveProfile() {
      this.activeProfile.profile.custom!.color = this.activeProfile.profile.custom!.color.replace('#', '');
      this.$emit('updateProfile', this.activeProfile);
      this.editorVisible = false;
    },
    removeIamRole(iamRole: IamRole, appProfile: AppData) {
      this.$ext.log('removeIamRole');
      const iamRoles: IamRole[] = [];
      appProfile.profile.custom!.iamRoles.forEach((role) => {
        if (role.roleName !== iamRole.roleName
          || role.accountId !== iamRole.accountId
          || role.profileId !== iamRole.profileId) {
          iamRoles.push(role);
        }
      });
      appProfile.profile.custom!.iamRoles = iamRoles;
      this.$emit('updateProfile', appProfile);
    },
    setProfiles(profiles) {
      this.$ext.log('setProfiles');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      profiles.forEach((profile) => {

      });
      this.$ext.log(profiles);
    },
    assumeIamRole(iamRole, appProfile) {
      // TODO notify on silent failure switching role
      this.$ext.log('assumeIamRole');
      this.$ext.log(iamRole);
      if (this.demoMode) {
        window.open('about:blank', '_blank');
        return;
      }
      const { settings } = this;
      settings.lastProfileId = appProfile.profile.id;
      this.$ext.saveSettings(settings).then(() => {
        this.$ext.queueIamLogin(iamRole, appProfile).then(() => {
          const profileUrl = this.$ext.createProfileUrl(this.user, appProfile);
          window.open(profileUrl, '_blank');
        });
      });
    },
    navSelectedProfile() {
      const profileUrl = this.$ext.createProfileUrl(this.user, this.selectedProfile);
      window.open(profileUrl, '_blank');
    },
    encodeUriPlusParens(str) {
      return encodeURIComponent(str).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16)}`,
      );
    },
    fave(appProfile) {
      // TODO fix favorite issue for multi users
      appProfile.profile.custom.favorite = !appProfile.profile.custom.favorite;
      this.$emit('updateProfile', appProfile);
    },
  },
};
</script>

<style lang="scss" scoped>
.sso-link {
  color: #495057;
  text-decoration: none;
  text-overflow: ellipsis;
  border-radius: 4pt;
}

.sso-link:hover {
  color: #5e3add;
  cursor: pointer;
}

.role-link {
  white-space: nowrap;
  margin-right: 5px;
}

.role-link:hover {
  background-color: #5e3add !important;
  cursor: pointer;
}

.remove-role-link:hover {
  background-color: red !important;
  cursor: pointer;
}

.pi-star:hover {
  color: gold !important;
  cursor: pointer;
}

.pi-star-fill {
  color: gold !important;
}

.pi-star-fill:hover {
  color: grey !important;
  cursor: pointer;
}

.p-inputtext {
  padding: 5px !important;
}

#consolePreview {
  opacity: 1 !important;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}
</style>
