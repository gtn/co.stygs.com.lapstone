package co.stygs.com.lapstone.objects.json.plugin;

import java.io.File;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;

import co.stygs.com.lapstone.objects.json.APlugin_JSON;
import co.stygs.com.lapstone.objects.json.LapstoneJSON;
import co.stygs.com.lapstone.objects.json.Wse_JSON;

public class Plugin_WebServiceError_JSON extends APlugin_JSON {

    public Plugin_WebServiceError_JSON() {
	// TODO Auto-generated constructor stub
    }

    @Override
    public Boolean release(File www, LapstoneJSON lapstoneJson) throws Exception{
	ObjectMapper objectMapper = new ObjectMapper();
	File configuration;
	File currentFile;
	configuration = new File(www, "js/plugin/plugin.WebServiceError.json");
	Plugin_WebServiceError_JSON webServiceErrorJson = objectMapper.readValue(configuration, Plugin_WebServiceError_JSON.class);
	for (String url : webServiceErrorJson.getWseFiles()) {
	    currentFile = new File(www, "page/" + url);
	    Wse_JSON wseJSON = objectMapper.readValue(currentFile, Wse_JSON.class);
	    webServiceErrorJson.getWse().putAll(wseJSON);
	    currentFile.delete();
	}
	objectMapper.writeValue(configuration, webServiceErrorJson);

	return null;
    }

    public Map<String, String> getActions() {
	return actions;
    }

    public void setActions(Map<String, String> actions) {
	this.actions = actions;
    }

    public List<String> getStrictErrorKeys() {
	return strictErrorKeys;
    }

    public void setStrictErrorKeys(List<String> strictErrorKeys) {
	this.strictErrorKeys = strictErrorKeys;
    }

    public List<String> getErrorKeys() {
	return errorKeys;
    }

    public void setErrorKeys(List<String> errorKeys) {
	this.errorKeys = errorKeys;
    }

    public List<String> getWseFiles() {
	return wseFiles;
    }

    public void setWseFiles(List<String> wseFiles) {
	this.wseFiles = wseFiles;
    }

    public Map<String, Map<String, String>> getWse() {
	return wse;
    }

    public void setWse(Map<String, Map<String, String>> wse) {
	this.wse = wse;
    }

    private Map<String, String> actions;
    private List<String> strictErrorKeys;
    private List<String> errorKeys;
    private List<String> wseFiles;
    private Map<String, Map<String, String>> wse;

}
