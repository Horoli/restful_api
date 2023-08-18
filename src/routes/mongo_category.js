const MongoDB = require("../mongodb");
const Utility = require("../utility");

module.exports = {
  "GET /mongo_category": {
    async handler(req, rep) {
      const { parent, id } = req.query;

      const categoryCol = await MongoDB.getCollection("category");

      const findResult = await categoryCol.find().toArray();

      console.log(await categoryCol.find({ subcategory: {} }, {}).toArray());

      console.log("findResult", findResult);
      // const insert = await mainCategories.insertOne({ zzz: "zzzz" });
      // const find = await mainCategories.find().toArray();
      // console.log(find);

      return {
        status: 200,
        data: [],
      };
    },
  },
  "POST /mongo_category": {
    async handler(req, rep) {
      const { parent, name } = req.body;

      // TODO : parent, name이 없으면 error
      if (parent === undefined || name === undefined) {
        const error = new Error("please check your input");
        error.status = 400;
        return error;
      }

      // const mainCategoryCol = await MongoDB.getCollection("mainCategory");
      // const mainCategories = await mainCategoryCol.findOne();

      const subCategoryCol = await MongoDB.getCollection("subCategory");
      const subCategories = await subCategoryCol.find({ parent: parent }).toArray();

      // console.log('subCategories', subCategories);

      const categoryModel = {
        id: Utility.UUID(true),
        parent: parent,
        children: [],
        name: name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await subCategoryCol.insertOne(categoryModel);

      const get = await subCategoryCol.updateOne({ id: parent }, { $push: { children: categoryModel.id } });
      console.log('get', get);
      return {
        status: 200,
        data: [],
      };
    },
  },

  "DELETE /mongo_category": {
    async handler(req, rep) {
      // TODO : 삭제할 category의 id를 입력 받음 
      const { id: targetId } = req.body;
      if (targetId === undefined) {
        const error = new Error("please check your input");
        error.status = 400;
        return error;
      }
      const subCategoryCol = await MongoDB.getCollection("subCategory");

      // TODO : 삭제할 data를 가져옴 
      const targetData = await subCategoryCol.findOne({ id: targetId });

      if (targetData === null) {
        console.log('targetData', targetData);
        const error = new Error("target is not exists");
        error.status = 400;
        return error;
      }

      // TODO : 삭제할 데이터의 parent 데이터를 가져와서 
      // children<Array>에 포함된 targetId를 삭제함
      await subCategoryCol.findOneAndUpdate(
        { id: targetData.parent },
        { $pull: { children: { $in: [targetId] } } },
      );
      console.log('update');
      await subCategoryCol.deleteOne({ id: targetId });
      console.log('delete');

      return {
        status: 200,
        data: {},
        message: `${targetId} is deleted`,
      }
    }
  }
};
