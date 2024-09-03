import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PageFormSelect,
  PageFormSubmitHandler,
  PageFormTextInput,
  PageHeader,
  PageLayout,
  useGetPageUrl,
  usePageNavigate,
} from '../../../../../framework';
import { PageFormMultiSelect } from '../../../../../framework/PageForm/Inputs/PageFormMultiSelect';
import { PageFormHidden } from '../../../../../framework/PageForm/Utils/PageFormHidden';
import { useGet } from '../../../../common/crud/useGet';
import { usePatchRequest } from '../../../../common/crud/usePatchRequest';
import { usePostRequest } from '../../../../common/crud/usePostRequest';
import { useInvalidateCacheOnUnmount } from '../../../../common/useInvalidateCache/useInvalidateCache';
import { hubAPI } from '../../../common/api/formatPath';
import { HubPageForm } from '../../../common/HubPageForm';
import { ContentTypeEnum } from '../../../interfaces/expanded/ContentType';
import { HubRbacRole } from '../../../interfaces/expanded/HubRbacRole';
import { HubRoute } from '../../../main/HubRoutes';
import { useHubRoleMetadata } from '../hooks/useHubRoleMetadata';
import { useIsValidRoleName } from '../hooks/useIsValidRoleName';

export function CreateRole(props: { breadcrumbLabelForPreviousPage?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageNavigate = usePageNavigate();

  useInvalidateCacheOnUnmount();

  const postRequest = usePostRequest<Partial<HubRbacRole>, HubRbacRole>();

  const onSubmit: PageFormSubmitHandler<HubRbacRole> = async (Role) => {
    const createdRole = {
      ...Role,
      content_type: Role.content_type === ContentTypeEnum.System ? null : Role.content_type,
    };
    const newRole = await postRequest(hubAPI`/_ui/v2/role_definitions/`, createdRole);
    pageNavigate(HubRoute.RolePage, { params: { id: newRole.id } });
  };
  const onCancel = () => navigate(-1);
  const getPageUrl = useGetPageUrl();

  return (
    <PageLayout>
      <PageHeader
        title={t('Create role')}
        breadcrumbs={[
          {
            label: props.breadcrumbLabelForPreviousPage || t('Roles'),
            to: getPageUrl(HubRoute.Roles),
          },
          { label: t('Create role') },
        ]}
      />
      <HubPageForm<HubRbacRole>
        submitText={t('Create role')}
        onSubmit={onSubmit}
        cancelText={t('Cancel')}
        onCancel={onCancel}
      >
        <HubRoleInputs />
      </HubPageForm>
    </PageLayout>
  );
}

export function EditRole(props: { breadcrumbLabelForPreviousPage?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageNavigate = usePageNavigate();
  const params = useParams<{ id?: string }>();
  const id = Number(params.id);
  const { data: Role } = useGet<HubRbacRole>(hubAPI`/_ui/v2/role_definitions/${id.toString()}/`);

  useInvalidateCacheOnUnmount();

  const postRequest = usePostRequest<Partial<HubRbacRole>, HubRbacRole>();
  const patchRequest = usePatchRequest<Partial<HubRbacRole>, HubRbacRole>();

  const onSubmit: PageFormSubmitHandler<HubRbacRole> = async (Role) => {
    if (Number.isInteger(id)) {
      Role = await patchRequest(hubAPI`/_ui/v2/role_definitions/${id.toString()}/`, Role);
      navigate(-1);
    } else {
      const newRole = await postRequest(hubAPI`/_ui/v2/role_definitions/`, Role);
      pageNavigate(HubRoute.RolePage, { params: { id: newRole.id } });
    }
  };
  const onCancel = () => navigate(-1);
  const getPageUrl = useGetPageUrl();

  if (Number.isInteger(id)) {
    if (!Role) {
      return (
        <PageLayout>
          <PageHeader
            breadcrumbs={[
              {
                label: props.breadcrumbLabelForPreviousPage || t('Roles'),
                to: getPageUrl(HubRoute.Roles),
              },
              { label: t('Edit Role') },
            ]}
          />
        </PageLayout>
      );
    } else {
      return (
        <PageLayout>
          <PageHeader
            title={Role?.name ? `${t('Edit')} ${Role?.name}` : t('Role')}
            breadcrumbs={[
              { label: t('Roles'), to: getPageUrl(HubRoute.Roles) },
              { label: Role?.name ? `${t('Edit')} ${Role?.name}` : t('Role') },
            ]}
          />
          <HubPageForm<HubRbacRole>
            submitText={t('Save role')}
            onSubmit={onSubmit}
            cancelText={t('Cancel')}
            onCancel={onCancel}
            defaultValue={{
              ...Role,
              content_type:
                Role?.content_type === null ? ContentTypeEnum.System : Role?.content_type,
            }}
          >
            <HubRoleInputs disableContentType />
          </HubPageForm>
        </PageLayout>
      );
    }
  }
}

function HubRoleInputs(props: { disableContentType?: boolean }) {
  const { t } = useTranslation();
  const { disableContentType } = props;
  const hubRoleMetadata = useHubRoleMetadata();
  const content_type = useWatch<HubRbacRole>({ name: 'content_type' });
  const isValidRoleName = useIsValidRoleName();

  return (
    <>
      <PageFormTextInput<HubRbacRole>
        name="name"
        label={t('Name')}
        validate={isValidRoleName}
        isRequired
      />
      <PageFormTextInput<HubRbacRole> name="description" label={t('Description')} />
      <PageFormSelect
        name={'content_type'}
        label={t('Content Type')}
        placeholderText={t('Select a content type')}
        options={[
          { value: 'galaxy.ansiblerepository', label: t('Repository') },
          { value: 'galaxy.collectionremote', label: t('Remote') },
          { value: 'galaxy.containernamespace', label: t('Execution Environment') },
          { value: 'galaxy.namespace', label: t('Namespace') },
          { value: 'null', label: t('System') },
        ]}
        isDisabled={disableContentType}
        isRequired
      />
      <PageFormHidden watch="content_type" hidden={(content_type: string) => !content_type}>
        <PageFormMultiSelect
          name="permissions"
          label={t('Permissions')}
          options={Object.entries(
            hubRoleMetadata.content_types[content_type as ContentTypeEnum]?.permissions || {}
          ).map(([key, value]) => ({
            label: value,
            value: key,
          }))}
          placeholder={t('Select permissions')}
          isRequired
        />
      </PageFormHidden>
    </>
  );
}
