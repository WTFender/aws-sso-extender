<!-- eslint-disable max-len -->
<template>
  <div>
    <h3>Add IAM Role</h3>
    <InputText
      id="iamRoleArn"
      v-model="newIamRole"
      name="arn"
      class="p-inputtext-sm"
      aria-describedby="arn-help"
      style="width: 400px"
      placeholder="arn:aws:iam::123412341234:role/roleName"
    />
    <br>
    <small id="arn-help">Enter the target AWS IAM Role ARN</small>
  </div><br>
  <MultiSelect
    v-model="selectedProfiles"
    filter
    :options="awsAppProfiles"
    name="awsAppProfiles"
    option-label="label"
    placeholder="Select SSO Profiles"
    display="chip"
    class="w-full md:w-20rem"
    aria-describedby="profiles-help"
    style="width: 400px"
  /><br>
  <small id="profiles-help">Select the SSO profiles that can assume this role</small>
  <br><br>
  <PrimeButton
    size="small"
    icon="pi pi-user-plus"
    class="p-button-primary"
    label="Add IAM Role"
    @click="addIamRole()"
  />
</template>

<script lang="ts">
import { AppData } from '../types';

export default {
  name: 'IamRoles',
  props: {
    appProfiles: {
      required: true,
      type: Array,
    },
  },
  emits: ['updateProfile'],
  data() {
    return {
      newIamRole: null,
      selectedProfiles: [],
    };
  },
  computed: {
    awsAppProfiles(): AppData[] {
      const appProfiles = this.appProfiles.filter((ap) => (ap as AppData).applicationName === 'AWS Account') as AppData[];
      // eslint-disable-next-line no-param-reassign
      appProfiles.forEach((ap) => { ap.label = `${ap.searchMetadata.AccountId} (${ap.searchMetadata.AccountName}) - ${ap.profile.name}`; });
      this.$ext.log(appProfiles);
      return appProfiles;
    },
  },
  created() {
    //
  },
  methods: {
    addIamRole() {
      var role = (<HTMLInputElement>document.getElementById('iamRoleArn')).value;
      if (role.startsWith('arn:aws:iam::')) {
        const accountId = role.split(':')[4];
        const roleName = role.split('/')[1];
        this.selectedProfiles.forEach((appProfile: AppData) => {
          const iamRole = {
            profileId: appProfile.profile.id,
            accountId,
            roleName,
            color: 'ffffff',
            label: 'test',
          };
          if ('iamRoles' in appProfile.profile.custom!) {
            appProfile.profile.custom.iamRoles!.push(iamRole);
          } else {
            // eslint-disable-next-line no-param-reassign
            appProfile.profile.custom!.iamRoles = [iamRole];
          }
          this.$emit('updateProfile', appProfile);
        });
      } else {
        throw Error('Bad ARN format');
      }
      role = '';
      this.selectedProfiles = [];
    },
  },
};
</script>

<style lang="scss" scoped>
</style>
