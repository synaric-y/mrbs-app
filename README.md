# meeting-room-reserve

This front-end project works as a wxwork Application.

## Project Setup

1. Open this project in WebStorm(vsCode).(Optional)
2. Open a terminal in <u>project root directory</u>, then run following commands:

    ```
    npm install
    
    npm run dev
    ```

3. Open following url via browsers(Chrome, Firefox, etc.).

   ```
   http://localhost:5173/#/room
   ```

    **Note:** Opening `localhost:5173/#/` won't work, cause it will automatically jump to <u>wxwork-oauth2-url</u>, but this url must be opened in wxwork. Thus, it will throw an error like "Please open this page in wxwork"

4. Open **Developer Tools** to view this web page in responsive mode. 

   If you use Chrome,  Press **Ctrl+Shift+I** will open developer tools. Then, click "Tool Device Toolbar" next to the "Element" tab.

## Customize configuration

1. Open and edit `.env.production` file.

    The file looks like this:

    ```
    VITE_APP_HOST = xxxxxxx
    ```

    Replace`xxxxxxx` to **real server API address**.

2. Open and edit `vite.config.js`. (Optional)

    Edit `line 37`, like this:

    ```
    target: 'xxxxx', // 新的目标地址
    ```

    Replace`xxxxxxx` to **real server API address**.

## Project Release

1. Run following command:

    ```
    npm run build
    ```

2. The complied files can be found in `/dist` directory.

    The directory structure is listed below:

    ```
    - assets
      - index-xxxx.js
      - index-xxxx.css
    - favicon.ico
    - index.html
    ```

3. Upload these files to server.

