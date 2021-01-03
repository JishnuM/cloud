import styled from "@emotion/styled";
import Link from "next/link";
import React, { ReactElement } from "react";
import { InnerWidth } from "./CommonViews";

const FooterA = styled.a`
  color: #bbb;
  text-decoration: underline;
  transition: color 0.25s ease-out, border 0.25s ease-out;
  :hover {
    color: white;
  }
`;
const LegalA = styled.a`
  color: #999;
  margin: 0 10px;
  transition: color 0.25s ease-out, border 0.25s ease-out;
  :hover {
    color: #777;
  }
`;
const LegalSection = styled.div`
  color: #aaa;
  text-align: center;
  margin: 10px 0;
`;
const CopyrightSection = styled.div`
  text-align: center;
  margin: 15px;
`;
const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
`;
const FooterTitle = styled.h6`
  font-size: 16px;
  font-weight: bold;
  color: #fff;
`;
const SitemapSection = styled.div`
  border-top: 1px solid #b1c8db;
  padding: 40px;
  background-color: #222;
  min-height 100px;
`;
const SocialSection = styled.div`
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
const GITHUB_COLOR = "#555";
const TWITTER_COLOR = "#1CA2F1";
const SOCIAL_ICON_SIZE = 28;

function GithubLogo() {
  return (
    <svg
      width={SOCIAL_ICON_SIZE}
      height={SOCIAL_ICON_SIZE}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 438.549 438.549"
    >
      <path
        fill={GITHUB_COLOR}
        d="M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 01-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 1.995 44.163-14.653 80.185-41.062 108.068-79.226 27.88-38.161 41.825-81.126 41.825-128.906-.01-39.771-9.818-76.454-29.414-110.049z"
      />
    </svg>
  );
}

function TwitterLogo() {
  return (
    <svg
      width={SOCIAL_ICON_SIZE}
      height={SOCIAL_ICON_SIZE}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3333 3333"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      imageRendering="optimizeQuality"
      fillRule="evenodd"
      clipRule="evenodd"
    >
      <path
        fill={TWITTER_COLOR}
        d="M1667 0c920 0 1667 746 1667 1667 0 920-746 1667-1667 1667C747 3334 0 2588 0 1667 0 747 746 0 1667 0zm900 1108c-66 30-137 49-212 58 76-46 135-118 162-204-71 42-151 73-234 90-68-72-163-116-270-116-204 0-369 165-369 369 0 29 3 57 9 84-307-16-579-162-761-386-33 56-50 120-50 186 0 128 65 241 164 307-61-2-117-19-167-46v5c0 179 127 328 296 362-31 8-64 13-97 13-24 0-47-2-70-7 47 147 183 253 345 257-127 99-285 158-459 158-30 0-59-2-88-5 164 105 358 166 566 166 679 0 1051-563 1051-1051 0-16 0-32-1-48 72-52 135-117 184-191z"
      />
    </svg>
  );
}

function LegalLink({ href, children }: React.PropsWithChildren<{ href: string }>) {
  return (
    <Link href={href} passHref>
      <LegalA>{children}</LegalA>
    </Link>
  );
}
function FooterLink({ href, children }: React.PropsWithChildren<{ href: string }>) {
  return (
    <Link href={href} passHref>
      <FooterA>{children}</FooterA>
    </Link>
  );
}

const LogoA = styled.a(
  (props) => `
  display: flex;
  font-size: 24px;
  margin: 20px;
  align-items: center;
  color: ${props.color};
  :hover {
    opacity: 0.8;
  }
  svg {
    margin-right: 10px;
  }
`,
);

function LogoLink({
  href,
  target,
  children,
  color,
}: React.PropsWithChildren<{ href: string; target?: string; color: string }>) {
  return (
    <Link passHref href={href}>
      <LogoA target={target} color={color}>
        {children}
      </LogoA>
    </Link>
  );
}
export default function SiteFooter(): ReactElement {
  return (
    <>
      <SitemapSection>
        <InnerWidth>
          <FooterSection>
            <FooterTitle>Cloud</FooterTitle>
            <FooterLink href="/preview">Home</FooterLink>
            <FooterLink href="/pricing">Pricing</FooterLink>
            <FooterLink href="/enterprise">Enterprise</FooterLink>
          </FooterSection>
          <FooterSection>
            <FooterTitle>Documentation</FooterTitle>
            <FooterLink href="/docs/getting-started">Getting Started</FooterLink>
            <FooterLink href="/docs/open-source">Open Source</FooterLink>
            <FooterLink href="/docs/react-nextjs">React NextJS</FooterLink>
            <FooterLink href="/docs/http-websocket-api">HTTP + WebSocket API</FooterLink>
            <FooterLink href="/docs/typescript">TypeScript</FooterLink>
          </FooterSection>
          <FooterSection>
            <FooterTitle>Support</FooterTitle>
            <FooterLink href="mailto:support@aven.io">
              {/* lol this is half-assed */}
              Email
            </FooterLink>
            <FooterLink href="/support">Support</FooterLink>
          </FooterSection>
        </InnerWidth>
      </SitemapSection>

      <SocialSection>
        <div>
          <LogoLink href={"https://github.com/AvenCloud"} target="_blank" color={GITHUB_COLOR}>
            <GithubLogo /> GitHub/AvenCloud
          </LogoLink>
          <LogoLink href={"https://twitter.com/Aven_Cloud"} target="_blank" color={TWITTER_COLOR}>
            <TwitterLogo /> Twitter@Aven_Cloud
          </LogoLink>
        </div>
      </SocialSection>

      <CopyrightSection>© {new Date().getFullYear()} Aven</CopyrightSection>

      <LegalSection>
        <LegalLink href="/legal/terms-of-service">Terms of Service</LegalLink> •
        <LegalLink href="/legal/privacy">Privacy Policy</LegalLink> •
        <LegalLink href="/legal/privacy#notice-to-california-residents---ccpa">GDPR & CCPA</LegalLink> •
        <LegalLink href="/code-of-conduct">Aven.io Code of Conduct</LegalLink>
      </LegalSection>
    </>
  );
}
