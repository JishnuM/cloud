import { push } from "all-the-cities";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../../api-utils/getVerifedUser";
import { APIButton } from "../../../components/APIButton";
import { MainSection } from "../../../components/CommonViews";
import { BasicSiteLayout } from "../../../components/SiteLayout";
import { SiteRoleAcceptButton } from "../../../components/SiteRoleButtons";
import { database } from "../../../data/database";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  const siteName = String(context.params?.siteName);
  if (!verifiedUser) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  // const sites = await database.site.findMany({
  //   where: { owner: { id: verifiedUser?.id } },
  //   select: { name: true, id: true },
  // });
  // const userWithEmails = await database.user.findUnique({
  //   where: { id: verifiedUser.id },
  //   include: {
  //     VerifiedEmail: { select: { email: true } },
  //     EmailValidation: { select: { email: true } },
  //   },
  // });
  const invite = await database.siteRoleInvitation.findFirst({
    where: {
      site: { name: siteName },
      OR: [{ recipientUserId: verifiedUser.id }, { toEmail: verifiedUser.email }],
    },
    select: { name: true, id: true, fromUser: { select: { email: true } } },
  });
  if (!invite) {
    return {
      redirect: { destination: "/account", permanent: false },
    };
  }
  return {
    props: {
      user: verifiedUser,
      siteName,
      invite: { roleType: invite?.name, fromEmail: invite?.fromUser.email },
    },
  };
};

export default function siteInvitePage({
  user,
  siteName,
  invite,
}: {
  invite: { fromEmail?: string; roleType: string };
  user: APIUser;
  siteName: string;
}): ReactElement {
  return (
    <BasicSiteLayout
      user={user}
      title={`Site Role Invite`}
      content={
        <>
          <MainSection title={`Invite to ${siteName}`}>
            Click to join <b>{siteName}</b> as an {invite.roleType} : <SiteRoleAcceptButton siteName={siteName} />
          </MainSection>
        </>
      }
    />
  );
}