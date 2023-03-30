<!-- eslint-disable vue/max-len -->
<!-- eslint-disable max-len -->
<template>
  <div
    class="card"
    style="padding-left: 20px;"
  >
    <h2>
      <img
        alt="AWS SSO Extender"
        src="../../public/icons/128.png"
        width="25"
        style="vertical-align:middle;"
      >
      Setup
    </h2>
    <Accordion
      :active-index="permissions.origins === false ? 0 : 1"
      style="padding-right: 20px; padding-bottom: 20px;"
    >
      <AccordionTab :disabled="permissions.origins">
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
          icon="pi pi-lock"
          class="p-button-success"
          label="Request Permissions"
          @click="requestPermissions()"
        />
        <!--- TODO add granular site perms options --->
      </AccordionTab>

      <AccordionTab :disabled="loaded">
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
        <div v-if="permissions.history === false">
          <p>Login to AWS SSO to populate your profiles. Your login link typically looks like this:</p>
          <code>companyName.awsapps.com/start#/</code>
          <br>
          <code>directoryId.awsapps.com/start#/</code>
        </div>
        <Divider
          v-if="!permissions.history"
          type="solid"
        >
          <small>Optional - Find login links in browser history</small>
        </Divider>
        <LoginLinks />
      </AccordionTab>
    </Accordion>
    <PrimeButton
      size="small"
      icon="pi pi-play"
      class="p-button-success"
      label="Demo"
      style="margin-bottom: 15px;"
      @click="$emit('demo')"
    />
  </div>
</template>

<script lang="ts">
export default {
  name: 'SetupSteps',
  props: {
    loaded: {
      required: true,
      type: Boolean,
      default: false,
    },
    permissions: {
      required: true,
      type: Object,
      default: () => ({
        origins: false,
        history: false,
      }),
    },
  },
  emits: ['demo'],
  methods: {
    requestPermissions(directoryId = null) {
      const { origins } = this.$ext.config;
      if (directoryId !== null) {
      // TODO support granular directory permissions
      // origins = [`'https://${directoryId}.awsapps.com/start*'`];
      }
      this.$browser.permissions.request({ origins });
      window.close();
    },
  },
};
</script>

  <style lang="scss" scoped>
  </style>
