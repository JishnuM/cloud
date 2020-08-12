import "../styles/globals.css";
import Head from "next/head";

import React from "react";
import { MDXProvider } from "@mdx-js/react";
import Title from "../components/Title";

const mdComponents = {
  h1: (props) => <Title {...props} />,
};

function Page({ children, meta }) {
  console.log(meta);
  return (
    <>
      <Head>
        <title>{meta?.title || "Aven"}</title>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff"></meta>
      </Head>
      {children}
    </>
  );
}

export default function getMDXPageComponent({ Component, pageProps }) {
  if (Component.renderStandalone) {
    return <Component {...pageProps} />;
  }
  console.log("har", Component.meta);
  return (
    <Page meta={Component.meta}>
      <MDXProvider components={mdComponents}>
        <Component {...pageProps} />
      </MDXProvider>
    </Page>
  );
}
