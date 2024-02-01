// import {
//   AppRegistry,
//   Button,
//   SafeAreaView,
//   StyleSheet
// } from "react-native";
// import {
//   GDrive,
//   ListQueryBuilder,
//   MimeTypes
// } from "@robinbobin/react-native-google-drive-api-wrapper";
// import React, {
//   useCallback,
//   useEffect,
//   useState
// } from "react";

// import { GoogleSignin } from "@react-native-google-signin/google-signin";

// // import { name } from './app.json';

// function uploadToGoogleDrive() {
//   const [gdrive] = useState(() => new GDrive());
//   const [ui, setUi] = useState();
  
//   const invoker = useCallback(async cb => {
//     try {
//       return await cb();
//     } catch (error) {
//       console.log(error);
//     }
//   }, []);
  
//   const createBinaryFile = useCallback(async () => {
//     console.log(await invoker(async () => (
//       await gdrive.files.newMultipartUploader()
//         .setData([1, 2, 3, 4, 5], MimeTypes.BINARY)
//         .setRequestBody({
//           name: "bin",
//           //parents: ["folder_id"]
//         })
//         .execute()
//     )));
//   }, [invoker]);
  
//   const createIfNotExists = useCallback(async () => {
//     console.log(await invoker(async () => (
//       await gdrive.files.createIfNotExists(
//         {
//           q: new ListQueryBuilder()
//             .e("name", "condition_folder")
//             .and()
//             .e("mimeType", MimeTypes.FOLDER)
//             .and()
//             .in("root", "parents")
//         },
//         gdrive.files.newMetadataOnlyUploader()
//           .setRequestBody({
//             name: "condition_folder",
//             mimeType: MimeTypes.FOLDER,
//             parents: ["root"]
//           })
//         )
//     )));
//   }, [invoker]);
  
//   const createFolder = useCallback(async () => {
//     console.log(await invoker(async () => (
//       await gdrive.files.newMetadataOnlyUploader()
//         .setRequestBody({
//           name: "Folder",
//           mimeType: MimeTypes.FOLDER,
//           parents: ["root"]
//         })
//         .execute()
//     )));
//   }, [invoker]);
  
//   const createTextFile = useCallback(async () => {
//     console.log(await invoker(async () => {
//       return (await gdrive.files.newMultipartUploader()
//         .setData("cm9iaW4=", MimeTypes.TEXT)
//         .setIsBase64(true)
//         .setRequestBody({
//           name: "base64 text",
//         })
//         .execute()).id;
//     }));
//   }, [invoker]);
  
//   const emptyTrash = useCallback(async () => {
//     if (await invoker(async () => {
//       await gdrive.files.emptyTrash();
      
//       return true;
//     }))
//     {
//       console.log("Trash emptied");
//     };
//   }, [invoker]);
  
//   const getWebViewLink = useCallback(async () => {
//     console.log(await invoker(async () => (
//       await gdrive.files.getMetadata(
//         "some_id", {
//           fields: "webViewLink"
//         }
//       )
//     )));
//   }, [invoker]);
  
//   const readFiles = useCallback(async () => {
//     console.log(await invoker(async () => (
//       await gdrive.files.getText("text_file_id")
//     )));
    
//     console.log(await invoker(async () => (
//       await gdrive.files.getBinary("bin_file_id", null, "1-1")
//     )))
//   }, [invoker]);
  
//   useEffect(() => {
//     GoogleSignin.configure({
//       scopes: [
//         "https://www.googleapis.com/auth/drive",
//         "https://www.googleapis.com/auth/drive.appfolder"
//       ]});
    
//     (async () => {
//       if (await invoker(async () => {
//         await GoogleSignin.signIn();
        
//         gdrive.accessToken = (await GoogleSignin.getTokens()).accessToken;
        
//         gdrive.files.fetchCoercesTypes = true;
//         gdrive.files.fetchRejectsOnHttpErrors = true;
//         gdrive.files.fetchTimeout = 1500;
        
//         return true;
//       }))
//       {
//         setUi([
//           ["create bin file", createBinaryFile],
//           ["create folder", createFolder],
//           ["create if not exists", createIfNotExists],
//           ["create text file", createTextFile],
//           ["empty trash", emptyTrash],
//           ["get webViewLink", getWebViewLink],
//           ["read files", readFiles]
//         ].map(([title, onPress], index) => (
//           <Button
//             key={index}
//             onPress={onPress}
//             title={title}
//           />
//         )));
//       }
//     })();
//   }, [
//     createBinaryFile,
//     createFolder,
//     createIfNotExists,
//     createTextFile,
//     emptyTrash,
//     getWebViewLink,
//     readFiles,
//     invoker
//   ]);
// }


// module.exports = { uploadToGoogleDrive };




// // const { google } = require('googleapis');
// // const axios = require('axios');
// // const RNFS = require('react-native-fs');

// // const CLIENT_ID = '1095299721221-locrsr4kamgcds6k3aa50fn5bevsc7ni.apps.googleusercontent.com';
// // const CLIENT_SECRET = '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';
// // const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
// // const REFRESH_TOKEN = '1//04SkKIrYW1E4uCgYIARAAGAQSNwF-L9IrdcUafasTfESt6dStazL4c239lBgMW_SxbDwC-kclrK_V4iUgHICa5pgrUCZAwYhm3Tg';

// // const oAuth2Client = new google.auth.OAuth2(
// //     CLIENT_ID,
// //     CLIENT_SECRET,
// //     REDIRECT_URI
// //   );
  
// //   oAuth2Client.setCredentials({
// //     refresh_token: REFRESH_TOKEN,
// //   });
  


// // const uploadFile = async () => {
// //   try {
// //     const filePath = RNFS.DocumentDirectoryPath + '/VokkoApp/assets/sounds/alfred3.m4a';

// //     const fileContent = await RNFS.readFile(filePath, 'base64');

// //     const response = await axios.post(
// //       'https://www.googleapis.com/upload/drive/v3/files?uploadType=media',
// //       fileContent,
// //       {
// //         headers: {
// //           'Authorization': `Bearer ${oAuth2Client.credentials.access_token}`,
// //           'Content-Type': 'audio/mp4',
// //         },
// //         params: {
// //           name: 'alfred3.m4a',
// //           mimeType: 'audio/mp4',
// //           parents: ['1eMvx9GHf_VGCi5nTsBZrohKuQJJm1O0X'],
// //         },
// //       }
// //     );

// //     console.log('File uploaded to Google Drive:', response.data);
// //   } catch (error) {
// //     console.error('Error uploading file to Google Drive:', error);
// //   }
// // };
// // uploadFile();

// // module.exports = { uploadFile };
