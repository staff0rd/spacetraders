import { renderToStaticMarkup } from "react-dom/server";
import NumberFormat, { NumberFormatProps } from "react-number-format";

export const formatNumber = (props: NumberFormatProps) =>
  renderToStaticMarkup(
    <NumberFormat
      {...props}
      displayType="text"
      renderText={(value) => value.toString()}
    />
  );

export const formatCurrency = (value: number) =>
  formatNumber({
    value,
    thousandSeparator: ",",
    prefix: "$",
  });
