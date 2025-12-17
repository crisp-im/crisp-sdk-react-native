package expo.modules.crispsdk

import im.crisp.client.external.data.message.content.AnimationContent
import im.crisp.client.external.data.message.content.AudioContent
import im.crisp.client.external.data.message.content.CarouselContent
import im.crisp.client.external.data.message.content.Content
import im.crisp.client.external.data.message.content.FieldContent
import im.crisp.client.external.data.message.content.FileContent
import im.crisp.client.external.data.message.content.PickerContent
import im.crisp.client.external.data.message.content.TextContent

/**
 * Parser for Message Content objects from JavaScript.
 * Converts Map<String, Any?> to Crisp SDK Content subclasses.
 *
 * TypeScript union type: MessageContent
 * Discriminated by "type" field: text, file, animation, audio, picker, field, carousel
 */
object ContentParser {

    /**
     * Parse a map from JavaScript into Content for Crisp.showMessage
     *
     * @param map Map with "type" discriminator and type-specific fields
     * @return Content subclass instance
     * @throws IllegalArgumentException for invalid or missing required fields
     */
    fun fromMap(map: Map<String, Any?>): Content {
        val type = map["type"] as? String
            ?: throw IllegalArgumentException("Missing required field: type")

        return when (type) {
            "text" -> parseTextContent(map)
            "file" -> parseFileContent(map)
            "animation" -> parseAnimationContent(map)
            "audio" -> parseAudioContent(map)
            "picker" -> parsePickerContent(map)
            "field" -> parseFieldContent(map)
            "carousel" -> parseCarouselContent(map)
            else -> throw IllegalArgumentException("Unknown message content type: $type")
        }
    }

    private fun parseTextContent(map: Map<String, Any?>): TextContent {
        val text = map["text"] as? String
            ?: throw IllegalArgumentException("Missing required field: text")
        return TextContent(text)
    }

    private fun parseFileContent(map: Map<String, Any?>): FileContent {
        val url = map["url"] as? String
            ?: throw IllegalArgumentException("Missing required field: url")
        val name = map["name"] as? String
            ?: throw IllegalArgumentException("Missing required field: name")
        val mimeType = map["mimeType"] as? String
            ?: throw IllegalArgumentException("Missing required field: mimeType")

        return FileContent(url, name, mimeType)
    }

    private fun parseAnimationContent(map: Map<String, Any?>): AnimationContent {
        val url = map["url"] as? String
            ?: throw IllegalArgumentException("Missing required field: url")
        val mimeType = map["mimeType"] as? String
            ?: throw IllegalArgumentException("Missing required field: mimeType")

        return AnimationContent(url, mimeType)
    }

    private fun parseAudioContent(map: Map<String, Any?>): AudioContent {
        val url = map["url"] as? String
            ?: throw IllegalArgumentException("Missing required field: url")
        val mimeType = map["mimeType"] as? String
            ?: throw IllegalArgumentException("Missing required field: mimeType")
        val duration = (map["duration"] as? Number)?.toInt()
            ?: throw IllegalArgumentException("Missing required field: duration")

        return AudioContent(url, mimeType, duration)
    }

    @Suppress("UNCHECKED_CAST")
    private fun parsePickerContent(map: Map<String, Any?>): PickerContent {
        val id = map["id"] as? String
            ?: throw IllegalArgumentException("Missing required field: id")
        val text = map["text"] as? String
            ?: throw IllegalArgumentException("Missing required field: text")
        val choicesArray = map["choices"] as? List<Map<String, Any?>>
            ?: throw IllegalArgumentException("Missing required field: choices")

        val choices = choicesArray.mapNotNull { choiceMap ->
            val value = choiceMap["value"] as? String ?: return@mapNotNull null
            val label = choiceMap["label"] as? String ?: return@mapNotNull null
            val selected = choiceMap["selected"] as? Boolean ?: false
            PickerContent.Choice.Builder(value, label)
                .setSelected(selected)
                .build()
        }

        return PickerContent.Builder(id, text, choices).build()
    }

    private fun parseFieldContent(map: Map<String, Any?>): FieldContent {
        val id = map["id"] as? String
            ?: throw IllegalArgumentException("Missing required field: id")
        val text = map["text"] as? String
            ?: throw IllegalArgumentException("Missing required field: text")
        val explain = map["explain"] as? String ?: ""
        val required = map["required"] as? Boolean ?: false

        return FieldContent.Builder(id, text, explain)
            .setRequired(required)
            .build()
    }

    @Suppress("UNCHECKED_CAST")
    private fun parseCarouselContent(map: Map<String, Any?>): CarouselContent {
        val text = map["text"] as? String
            ?: throw IllegalArgumentException("Missing required field: text")
        val targetsArray = map["targets"] as? List<Map<String, Any?>>
            ?: throw IllegalArgumentException("Missing required field: targets")

        val targets = targetsArray.mapNotNull { targetMap ->
            val title = targetMap["title"] as? String ?: return@mapNotNull null
            val description = targetMap["description"] as? String ?: ""
            val imageUrl = targetMap["imageUrl"] as? String
            val actionUrl = targetMap["actionUrl"] as? String

            // Build actions list from actionUrl if provided
            val actions = if (actionUrl != null) {
                listOf(CarouselContent.Target.Action("Open", actionUrl))
            } else {
                emptyList()
            }

            CarouselContent.Target.Builder(title, description, actions)
                .apply { imageUrl?.let { setImage(it) } }
                .build()
        }

        return CarouselContent(text, targets)
    }
}
