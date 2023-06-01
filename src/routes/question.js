const Database = require("../datebase");
const Utility = require("../utility");

module.exports = {
  // TODO : 주관식(short-form) 문제 생성
  "POST /question": {
    middlewares: ["auth"],
    async handler(req, rep) {
      const { question, answer, categoryID, difficulty, score, images, periodID, info, description } =
        req.body;

      if (question === '' || answer === '' || categoryID === '') {

        console.log('question', question === '');
        const error = new Error('paramater is empty')
        error.status = 400;
        return error;
      }

      const questionID = Utility.UUID();
      const questionCol = Database.sharedInstance().getCollection("question");

      const imageIDs = [];

      if (images.length > 0) {
        for (const image of images) {
          const imageID = Utility.saveImage(image);
          imageIDs.push(imageID);
        }
      }

      return {
        statusCode: 200,
        data:
          questionCol.set(questionID, {
            id: questionID,
            question: question,
            answer: answer,
            updatedAt: Date.now(),
            createdAt: Date.now(),
            // TODO : categoryId는 children이 없는 categoryId를 받아야함.
            // children이 있는 id를 받으면 error
            categoryID: categoryID,
            // TODO : difficultyCol 생성 후 클라이언트에서 선택한 difficulty를 입력할 수 있도록 해야함
            difficulty: difficulty,
            score: score,
            // TODO : periodCol 생성해서 id를 입력받음
            period: [],
            // TODO : 이미지(base64String) 저장
            imageIDs: imageIDs,
            info: info,
            description: description,
          }),
        // questionID: {
        //   id: questionID,
        //   question: question,
        //   answer: answer,
        //   updatedAt: Date.now(),
        //   createdAt: Date.now(),
        //   // TODO : categoryId는 children이 없는 categoryId를 받아야함.
        //   // children이 있는 id를 받으면 error
        //   categoryID: categoryID,
        //   // TODO : difficultyCol 생성 후 클라이언트에서 선택한 difficulty를 입력할 수 있도록 해야함
        //   difficulty: difficulty,
        //   score: score,
        //   // TODO : periodCol 생성해서 id를 입력받음
        //   period: [],
        //   images: images,
        // }

      };
    },
  },

  "POST /filteredquestion": {
    middlewares: ["auth"],
    async handler(req, rep) {
      const { subCategoryID } = req.body;
      console.log("subCategoryID", subCategoryID);

      const categoryCol = Database.sharedInstance().getCollection("category");
      const questionCol = Database.sharedInstance().getCollection("question");

      const questionValues = Object.values(questionCol["$dataset"]);


      const filteredQuestion = questionValues.filter(
        (item) => item.categoryID === subCategoryID
      );

      console.log("filteredQuestion", filteredQuestion);

      const returnValue = filteredQuestion;


      return {
        data: returnValue,
      };
    },
  },

  // TODO : object.values만 return(type : list)
  "GET /question": {
    middlewares: ["auth"],
    async handler(req, rep) {
      const questionCol = Database.sharedInstance().getCollection("question");
      const questions = Object.values(questionCol["$dataset"]);

      // questions에 저장된 question의 imageIDs에 저장된 imageID를 이용해서
      // 'src/assets/images'에 저장된 파일 중 해당 uuid를 가진 파일의 내용을 읽어서 base64로 변환 후 리턴

      // questions의 question의 imageIDs를 복사해서 copyQuestions에 저장
      // const copyQuestions = { ...questions };

      // for (const question of copyQuestions) {
      //   const images = [];
      //   // for (const imageID of question.images) {
      //   //   const image = Utility.getImage(imageID);
      //   //   images.push(image);
      //   // }
      //   // question.images = images;

      //   question.images = question.images.map((image) => {
      //     return Utility.getImage(image);
      //   })
      // }

      return {
        data: questions,
      };
    },
  },

  // image/id를 입력받으면 해당 id를 가져와
  // buffer로 변환 후 return 해줌
  // 해당 method는 클라이언트에서 image를 활용하는 곳에서만
  "GET /image/:id": {
    middlewares: ["auth"],
    async handler(req, rep) {
      const { id } = req.params;
      const imageBase64String = Utility.getImage(id);
      const imageBuffer = Buffer.from(imageBase64String, "base64");
      rep.header("Content-Type", "image/png");
      return imageBuffer
    }
  },

  "PATCH /question": {
    middlewares: ["auth"],
    async handler(req, rep) {
      const { id, question, answer, categoryID, images, info, description } = req.body;



      if (question === '' || answer === '' || categoryID === '') {

        console.log('question', question === '');
        const error = new Error('paramater is empty')
        error.status = 400;
        return error;
      }

      const questionCol = Database.sharedInstance().getCollection("question");

      const getQuestion = questionCol["$dataset"][id];

      const imageIDs = [];

      console.log('getQuestion.imageIDs', getQuestion.imageIDs);

      console.log(getQuestion.imageIDs.length);

      console.log('images.length', images.length);

      // TODO : 기존에 저장된 이미지가 있고, 새로운 이미지가 없을 때
      if (images.length === 0 && getQuestion.imageIDs.length !== 0) {

        // console.log('image step1');
        imageIDs = getQuestion.imageIDs;

      }

      // TODO : 기존에 저장된 이미지가 있고, 새로운 이미지가 있을 때
      if (images.length !== 0 && getQuestion.imageIDs.length !== 0) {
        console.log('image step2');

        // 기존에 저장된 이미지 삭제
        for (const imageID of getQuestion.imageIDs) {
          Utility.deleteImage(imageID);
        }

        for (const image of images) {
          const imageID = Utility.saveImage(image);
          imageIDs.push(imageID);
        }
      }



      // TODO : 기존에 저장된 이미지가 없고, 새로운 이미지가 있을 때
      if (images.length !== 0 && getQuestion.imageIDs.length === 0) {
        console.log('image step3');
        for (const image of images) {
          const imageID = Utility.saveImage(image);
          imageIDs.push(imageID);
        }
      }

      getQuestion.question = question;
      getQuestion.answer = answer;
      getQuestion.categoryID = categoryID;
      getQuestion.updatedAt = Date.now();
      getQuestion.imageIDs = imageIDs;
      getQuestion.description = description;
      getQuestion.info = info;

      return {
        statusCode: 200,
        message: "ok",
        data: getQuestion,
      };
    },
  },

  // TODO : 객관식(multipleChoice) 문제 생성
  "POST /mcquestion": {
    middlewares: ["auth"],
    async handler(req, rep) {
      return {
        data: "ok",
      };
    },
  },
};
