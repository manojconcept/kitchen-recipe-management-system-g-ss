import { MongoClient } from "mongodb";

const {
    MONGO_URL_LIVE,
    MONGO_URL_LOCAL,
    KR,
    KR_COUNTRY,
    KRMS,
    KRMS_USER
} = process.env

const MONGO_CONNECT = MONGO_URL_LIVE;
// const MONGO_CONNECT = MONGO_URL_LOCAL;

const createConnection = async () => {
    const client = new MongoClient(MONGO_CONNECT);
    await client.connect();
    console.log(`Mongodb is connected`);
    return client;
}

const client = await createConnection();

//>>>>>>>DB's/create DB<<<<
const krDB = client.db(KR);
const kmrsDB = client.db(KRMS);
const kmrsUserDb = client.db("krms_users");
//>>>>>>>>>>collection's/Create Collection<<<<<<<<<<
const KR_Client = krDB.collection(KR_COUNTRY);
const KMRS_Client = kmrsDB.collection(KRMS_USER);
const KRMS_USER_Client = (user_id) => kmrsUserDb.collection(user_id)

export {
    KR_Client,
    KMRS_Client,
    krDB,
    kmrsDB,
    KRMS_USER_Client,
}

