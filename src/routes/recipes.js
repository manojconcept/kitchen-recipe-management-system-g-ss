import express from "express";
import { auth } from "../middleware/auth.js";
import * as recipeService from "../services/recipes.js";
import * as userService from "../services/user.js";
import * as kmrsuserService from "../services/krmsusers.js";
import { timeStamp, recipeTypes } from "../config/utils.js";

const router = express.Router();

const {
    postRecipe,
    recipeResetIsDelete,
    recipeTruncate,
    recipeById,
    recipeIsDeleteById,
    recipeDeleteById,
    recipeUpdate,
    setLimitByGetAllRecipe,
    getAllRecipeBycount,
    // getRecipeRecentlyAdd,
    recipeTimeUpdate,
    getRecipeAllTypes,
} = recipeService

const {
    getUserByName
} = userService

const {
    createUserRecipesListAddon,
    countUserRecipesListAddon,
} = kmrsuserService

const message = { message: "not found" }

router.use(auth)

//----> front page
router.get("", async (req, res) => {
    try {
        const batchSize = 12;
        const currentPage = parseInt(req.query.limit) || 1;
        const offset = (currentPage - 1) * batchSize;
        const reqQuery = req.query;
        const { limit, ...queryParams } = reqQuery;

        const total_count = await getAllRecipeBycount(queryParams);
        const types = await getRecipeAllTypes()
        const data = await setLimitByGetAllRecipe(offset, batchSize, queryParams);

        // const getRecently = await getRecipeRecentlyAdd();
        // console.log(getRecently);

        const count = {
            total_count,
            batch_count: data.length,
            page_count: currentPage
        };
        res.send({ success: true, count, types, data } || message);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send({ success: false, error: 'Internal Server Error' });
    }
});
//------------------------->count
router.get("/recipesCount", async (req, res) => {
    try {
        const counts = {};
        for (const recipeType in recipeTypes) {
            counts[recipeType] = {};
            for (const subtype of recipeTypes[recipeType]) {
                counts[recipeType][subtype] = await getAllRecipeBycount({ [recipeType]: subtype });
            }
        }
        console.log(counts);
        res.send({ success: true, total: counts })

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send({ success: false, error: 'Internal Server Error' });
    }
}
)

//--------------> post
router.post("", async (req, res) => {
    try {

        const {
            name,
            image_url,
            description,
            cuisine,
            course,
            diet,
            prep_time,
            ingredients,
            instructions,
            created,
        } = req.body;

        const totalRecipeCount = await getAllRecipeBycount()
        const userDetails = await getUserByName({ username: created })
        const userObjId = JSON.stringify(userDetails._id)
        const kmrsUserCountListAddonCount = await countUserRecipesListAddon(userObjId)
        const countCheck = () => {
            if (kmrsUserCountListAddonCount === 0) {
                return totalRecipeCount + 1
            }
            return totalRecipeCount + (kmrsUserCountListAddonCount + 1);
        }

        const value = {
            name,
            image_url,
            description,
            cuisine,
            course,
            diet,
            prep_time,
            ingredients,
            instructions,
            timeStamp: timeStamp(),
            image_available: 1,
            id: countCheck(),
            saved: "",
            created,
            deleted: false
        }

        /*
        1. get username from post,
        2. get getUserByName --> from there take object  _id --> make that into  stringify;
        3.then pass it in the functon
         */

        const result = await createUserRecipesListAddon(userObjId,value);
        // const result = await postRecipe(value)
        res.send(result);

    } catch (error) {
        console.log("Error handling request", error)
        res.status(422).send({ message: "Unprocessable Entity" })
    }
})
//-------------------> update
router.put("/:id?_method=PUT", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id)
        const updatedRecipe = req.body;
        const result = await recipeUpdate(id, updatedRecipe)
        res.send(result)
    } catch (error) {
        console.log("Error handling requeset", error)
        res.status(304).send({ message: "Not Modified" })
    }
})

//----------------------------->  reset all time stamp;
router.put("/timeupdate", async (req, res) => {
    try {
        const result = await recipeTimeUpdate()
        console.log(result);

        res.send(result)

    } catch {
        console.log("Error handling requeset", error)
        res.status(304).send({ message: "Not Modified" })
    }
});

//-------------------------> boolean reset update deleted false
router.put("", async (req, res) => {
    try {
        const result = await recipeResetIsDelete();
        res.send(result);
    } catch (error) {
        console.log("Error handling requeset", error)
        res.status(304).send({ message: "Not Modified" })
    }
})

//--------------------------------->truncate
router.delete("", async (req, res) => {
    try {
        const result = await recipeTruncate();
        res.send(result);
    } catch (error) {
        console.log("Error handling request", error);
        res.status(204).send({ message: "No Content" })
    }
})

//--------------------------------------> getId
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    console.log(id);
    console.log(req.params)
    try {
        const getsingleRecipe = await recipeById(id);
        res.send(getsingleRecipe || message)
    } catch (error) {
        console.error("Error handling request:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

//---------------------------------------------> update single delete
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id);
        const result = await recipeIsDeleteById(id);
        res.send(result);
    } catch (error) {
        console.log("Error handling request:", error);
        res.status(304).send({ message: "Not Modified" })

    }
})

//----------------------------------------------------> single delete

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await recipeDeleteById(id)
        res.send(result);
    } catch (error) {
        console.log("Error handling request:", error);
        res.status(204).send({ message: "No Content" })
    }
})

//-------------------------------------------------------> count api

export const recipesRoute = router