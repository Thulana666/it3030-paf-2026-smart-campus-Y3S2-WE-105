
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

public class DbCheck {
    public static void main(String[] args) {
        String uri = "mongodb+srv://smartcampus_admin:SmartCampus%40123@smartcampushub.uoi4nez.mongodb.net/smartcampus?retryWrites=true&w=majority&appName=SmartCampusHub&authSource=admin";
        try (MongoClient mongoClient = MongoClients.create(uri)) {
            MongoDatabase database = mongoClient.getDatabase("smartcampus");
            MongoCollection<Document> collection = database.getCollection("resources");
            System.out.println("--- All Resources in DB ---");
            for (Document doc : collection.find()) {
                System.out.println("ID: " + doc.get("_id") + " | Name: " + doc.get("name") + " | Status: " + doc.get("status"));
            }
            System.out.println("---------------------------");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
