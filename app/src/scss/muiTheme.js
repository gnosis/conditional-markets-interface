import { createMuiTheme } from "@material-ui/core/styles";
import { blackColor, blueColor, font } from "scss/_variables.scss";

const theme = createMuiTheme({
  typography: {
    fontFamily: font
  },
  palette: {
    primary: {
      main: blueColor
    },
    text: {
      primary: blackColor
    }
  }
});

export default theme;
