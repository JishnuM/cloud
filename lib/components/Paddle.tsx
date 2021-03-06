import { Button } from "@chakra-ui/core";
import { ReactElement } from "react";
import { APIUser } from "../server/getVerifedUser";
import { browserScriptLoad } from "../client/BrowserScript";

export function DevPreviewSubscribeButton({ label, user }: { label?: string; user: APIUser }): ReactElement {
  return (
    <Button
      colorScheme="avenColor"
      onClick={() => {
        browserScriptLoad("https://cdn.paddle.com/paddle/paddle.js")
          .then(() => {
            const Paddle = (window as any).Paddle;
            Paddle.Setup({ vendor: 123776 });
            Paddle.Checkout.open({
              product: 637971,
              email: user.email,
              quantity: 1,
              allowQuantity: false,
              success: "https://aven.io/account/billing",
              passthrough: JSON.stringify({ userId: user.id }),
            });
          })
          .catch((e) => {
            console.error(e);
            alert("Failed");
          });
      }}
    >
      {label || "Join the Developer Preview"}
    </Button>
  );
}
